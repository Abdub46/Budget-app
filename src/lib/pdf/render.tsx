import { renderToBuffer } from '@react-pdf/renderer';
import MonthlyReportDocument from '@/lib/pdf/MonthlyReportDocument';
import type { IReport } from '@/models/Report';

export async function renderMonthlyReportPDF(params: {
  userName: string;
  currency: string;
  month: number;
  year: number;
  snapshot: IReport['snapshot'];
}): Promise<Buffer> {
  return renderToBuffer(<MonthlyReportDocument {...params} />);
}
