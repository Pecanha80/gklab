import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function handleExportSession(sessionId: string): Promise<boolean> {
  const element = document.getElementById(`session-card-${sessionId}`);
  if (!element) return false;
  try {
    const canvas = await html2canvas(element, { backgroundColor: '#f8fafc', scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`training-session-${sessionId}.pdf`);
    return true;
  } catch (error) {
    console.error('Error exporting session:', error);
    return false;
  }
}
