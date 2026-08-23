'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Download, Send, FileText, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { monthLabel } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface ReportItem {
  _id: string;
  month: number;
  year: number;
  filename: string;
  emailSent: boolean;
  generatedAt: string;
  sentAt?: string;
}

export default function ReportHistory() {
  const [items, setItems] = useState<ReportItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?page=${page}&limit=8`);
      const result = await res.json();
      if (res.ok) {
        setItems(result.items);
        setTotalPages(result.pagination.totalPages);
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDownload = async (report: ReportItem) => {
    try {
      const res = await fetch(`/api/reports/${report._id}/download`);
      if (!res.ok) {
        const result = await res.json();
        toast.error(result.error || 'Could not download report.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Could not download report.');
    }
  };

  const handleResend = async (report: ReportItem) => {
    setResendingId(report._id);
    try {
      const res = await fetch(`/api/reports/${report._id}/resend`, { method: 'POST' });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || 'Could not resend report.');
        return;
      }
      toast.success(`${report.filename} resent to your email.`);
      load();
    } finally {
      setResendingId(null);
    }
  };

  if (!loading && items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No monthly reports yet — they&apos;ll appear here once a month completes, or you generate one manually.
      </p>
    );
  }

  return (
    <div>
      <ul className="divide-y divide-border">
        {items.map((report) => (
          <li key={report._id} className="flex items-center gap-3 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{report.filename}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {monthLabel(report.month, report.year)}
                {report.emailSent && (
                  <span className="inline-flex items-center gap-0.5 text-success ml-1.5">
                    <CheckCircle2 className="h-3 w-3" /> Emailed
                  </span>
                )}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleDownload(report)}>
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleResend(report)}
              isLoading={resendingId === report._id}
            >
              {resendingId !== report._id && <Send className="h-3.5 w-3.5" />}
              Resend
            </Button>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
