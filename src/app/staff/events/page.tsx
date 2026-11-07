import { PageHeader } from "@/components/app/page-header";
import { Assignments } from "@/components/staff/assignments";

export default function StaffEventsPage() {
  return (
    <>
      <PageHeader title="Ngày hiến máu" description="Các chiến dịch bạn được phân công. Mở chiến dịch đang diễn ra để tiếp đón, khám và lấy máu." />
      <Assignments />
    </>
  );
}
