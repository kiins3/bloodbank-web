"use client";

import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { AlertTriangle, Clock, Loader2, Plus, Siren, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/app/field";
import { NativeSelect, toOptions } from "@/components/app/native-select";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { api } from "@/lib/api";
import { addDays, BLOOD_GROUPS, productType, toApiDate, toInputDate } from "@/lib/format";
import type { BloodRequestDetail, Priority } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRODUCT_TYPES = ["TUI_HONG_CAU", "TUI_HUYET_TUONG", "TUI_TIEU_CAU", "MAU_TOAN_PHAN"] as const;
// Bags are collected at these nominal volumes; the warehouse matches on exact volume.
const VOLUMES = [250, 350, 450];

/** Latest deadline the backend accepts for an urgent request (48 hours from today's start). */
const urgentLimit = () => toInputDate(addDays(new Date(), 2));
const today = () => toInputDate(new Date());

const schema = z
  .object({
    priority: z.enum(["BINH_THUONG", "KHAN_CAP"]),
    deadlineDate: z.string().min(1, "Chọn ngày cần máu"),
    details: z
      .array(
        z.object({
          bloodType: z.string().min(1, "Chọn nhóm máu"),
          productType: z.enum(PRODUCT_TYPES),
          volume: z.coerce.number<number>(),
          quantity: z.coerce.number<number>().int("Số nguyên").min(1, "Ít nhất 1").max(50, "Tối đa 50"),
        }),
      )
      .min(1, "Thêm ít nhất một loại máu"),
  })
  .refine((v) => v.deadlineDate >= today(), { path: ["deadlineDate"], message: "Không được chọn ngày đã qua" })
  .refine((v) => v.priority !== "KHAN_CAP" || v.deadlineDate <= urgentLimit(), {
    path: ["deadlineDate"],
    message: "Yêu cầu khẩn cấp chỉ dành cho ca cần máu trong 48 giờ tới",
  });
type Values = z.infer<typeof schema>;

const emptyItem = { bloodType: "", productType: "TUI_HONG_CAU" as const, volume: 350, quantity: 1 };

export function RequestForm({ initial }: { initial?: BloodRequestDetail }) {
  const router = useRouter();
  const editing = !!initial;
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? {
          priority: initial.priority,
          deadlineDate: initial.deadlineDate,
          details: initial.requestedItems.map((i) => ({
            bloodType: i.bloodType,
            productType: i.productType as Values["details"][number]["productType"],
            volume: i.volume,
            quantity: i.quantity,
          })),
        }
      : { priority: "BINH_THUONG", deadlineDate: toInputDate(addDays(new Date(), 3)), details: [emptyItem] },
  });
  const items = useFieldArray({ control: form.control, name: "details" });
  const { errors } = form.formState;
  const current = useWatch({ control: form.control, name: "priority" });
  const watchedItems = useWatch({ control: form.control, name: "details" });

  const submit = useApiMutation(
    (v: Values) => {
      const body = { ...v, deadlineDate: toApiDate(v.deadlineDate) };
      return editing
        ? api<string>(`/api/hospital/blood-request/update/${initial.requestId}`, { method: "PUT", body })
        : api<string>("/api/hospital/blood-request/rq", { method: "POST", body });
    },
    {
      invalidate: [["hospital"]],
      onSuccess: (message) => {
        // The backend message explains side effects (e.g. an edit resets the FIFO queue position).
        toast.success(typeof message === "string" ? message : "Đã gửi yêu cầu");
        router.push(editing ? `/hospital/requests/${initial.requestId}` : "/hospital/requests");
      },
    },
  );

  function choosePriority(p: Priority) {
    form.setValue("priority", p, { shouldValidate: form.formState.isSubmitted });
    if (p === "KHAN_CAP" && form.getValues("deadlineDate") > urgentLimit()) {
      form.setValue("deadlineDate", toInputDate(addDays(new Date(), 1)));
    }
  }

  const totalBags = (watchedItems ?? []).reduce((s, d) => s + (Number(d.quantity) || 0), 0);

  return (
    <form onSubmit={form.handleSubmit((v) => submit.mutate(v))} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Mức độ ưu tiên</CardTitle>
            <CardDescription>Yêu cầu khẩn cấp được báo ngay cho kho máu và xử lý trước.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {([
              { value: "BINH_THUONG", title: "Bình thường", desc: "Kế hoạch điều trị, phẫu thuật theo lịch", icon: Clock },
              { value: "KHAN_CAP", title: "Khẩn cấp", desc: "Cần máu trong vòng 48 giờ", icon: Siren },
            ] as const).map((o) => {
              const disabled = editing && o.value === "KHAN_CAP";
              return (
                <button
                  type="button"
                  key={o.value}
                  disabled={disabled}
                  onClick={() => choosePriority(o.value)}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                    current === o.value
                      ? o.value === "KHAN_CAP"
                        ? "border-rose-500 bg-rose-50 ring-1 ring-rose-500"
                        : "border-primary bg-primary/5 ring-1 ring-primary"
                      : "hover:bg-muted/50",
                  )}
                >
                  <o.icon className={cn("mt-0.5 size-5", o.value === "KHAN_CAP" ? "text-rose-600" : "text-primary")} />
                  <span>
                    <span className="block font-medium">{o.title}</span>
                    <span className="block text-xs text-muted-foreground">{disabled ? "Không thể chuyển sang khẩn cấp khi sửa" : o.desc}</span>
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Máu cần cấp</CardTitle>
            <CardDescription>Mỗi dòng là một nhóm máu và loại chế phẩm.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {items.fields.map((f, i) => {
              const e = errors.details?.[i];
              return (
                <div key={f.id} className="grid grid-cols-2 items-start gap-3 rounded-lg border p-3 sm:grid-cols-[110px_1fr_110px_90px_auto]">
                  <Field label="Nhóm máu" error={e?.bloodType?.message}>
                    <NativeSelect placeholder="Chọn" options={BLOOD_GROUPS.map((g) => ({ value: g, label: g }))} {...form.register(`details.${i}.bloodType`)} />
                  </Field>
                  <Field label="Chế phẩm">
                    <NativeSelect
                      options={toOptions(productType).sort((a, b) => PRODUCT_TYPES.indexOf(a.value as never) - PRODUCT_TYPES.indexOf(b.value as never))}
                      {...form.register(`details.${i}.productType`)}
                    />
                  </Field>
                  <Field label="Thể tích">
                    <NativeSelect options={VOLUMES.map((v) => ({ value: String(v), label: `${v} ml` }))} {...form.register(`details.${i}.volume`)} />
                  </Field>
                  <Field label="Số túi" error={e?.quantity?.message}>
                    <Input type="number" min={1} max={50} {...form.register(`details.${i}.quantity`)} />
                  </Field>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="col-span-2 -mt-1 justify-self-end text-muted-foreground sm:col-span-1 sm:mt-6"
                    disabled={items.fields.length === 1}
                    onClick={() => items.remove(i)}
                    aria-label="Xóa dòng"
                  >
                    <Trash2 />
                  </Button>
                </div>
              );
            })}
            {errors.details?.root?.message && <p className="text-xs text-destructive">{errors.details.root.message}</p>}
            <Button type="button" variant="outline" className="w-fit" onClick={() => items.append(emptyItem)}>
              <Plus /> Thêm loại máu
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid content-start gap-6 self-start lg:sticky lg:top-6">
        <Card>
          <CardHeader>
            <CardTitle>Thời hạn</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field
              label="Ngày cần máu"
              error={errors.deadlineDate?.message}
              hint={current === "KHAN_CAP" ? `Chậm nhất ${urgentLimit().split("-").reverse().join("/")}` : undefined}
            >
              <Input type="date" min={today()} max={current === "KHAN_CAP" ? urgentLimit() : undefined} {...form.register("deadlineDate")} />
            </Field>
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Số dòng</span><span className="font-medium">{items.fields.length}</span></div>
              <div className="mt-1 flex justify-between"><span className="text-muted-foreground">Tổng số túi</span><span className="font-medium tabular-nums">{totalBags}</span></div>
            </div>
            {editing && (
              <p className="flex gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                <AlertTriangle className="size-4 shrink-0" />
                Mỗi yêu cầu chỉ được sửa một lần. Sau khi sửa, yêu cầu sẽ xếp lại cuối hàng chờ duyệt.
              </p>
            )}
            <Button type="submit" size="lg" disabled={submit.isPending} variant={current === "KHAN_CAP" ? "destructive" : "default"}>
              {submit.isPending && <Loader2 className="animate-spin" />}
              {editing ? "Lưu thay đổi" : current === "KHAN_CAP" ? "Gửi yêu cầu khẩn cấp" : "Gửi yêu cầu"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
