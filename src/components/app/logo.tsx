import Link from "next/link";
import { Droplet } from "lucide-react";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/30">
        <Droplet className="size-4 fill-current" />
      </span>
      <span>
        BloodBank<span className="text-primary">VN</span>
      </span>
    </Link>
  );
}
