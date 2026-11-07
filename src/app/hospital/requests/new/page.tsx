import { PageHeader } from "@/components/app/page-header";
import { RequestForm } from "@/components/hospital/request-form";

export default function NewRequestPage() {
  return (
    <>
      <PageHeader title="Gửi yêu cầu máu" description="Kho máu duyệt theo thứ tự gửi, yêu cầu khẩn cấp được ưu tiên." />
      <RequestForm />
    </>
  );
}
