// frontend/src/utils/export.js
import jsPDF from 'jspdf';

export const exportToPNG = (canvasRef, boardName = 'whiteboard') => {
  try {
    const canvas = canvasRef.current;
    if (!canvas) {
      alert('Canvas not found');
      return;
    }

    // Create download link
    const link = document.createElement('a');
    link.download = `${boardName.replace(/[^a-z0-9]/gi, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    console.log('✅ Exported to PNG');
  } catch (error) {
    console.error('Export to PNG failed:', error);
    alert('Failed to export PNG');
  }
};

export const exportToPDF = (canvasRef, boardName = 'whiteboard') => {
  try {
    const canvas = canvasRef.current;
    if (!canvas) {
      alert('Canvas not found');
      return;
    }

    // Get canvas dimensions
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Create PDF with canvas aspect ratio
    const pdf = new jsPDF({
      orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
      unit: 'px',
      format: [imgWidth, imgHeight]
    });

    // Convert canvas to image
    const imgData = canvas.toDataURL('image/png');

    // Add image to PDF
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // Download PDF
    pdf.save(`${boardName.replace(/[^a-z0-9]/gi, '_')}.pdf`);

    console.log('✅ Exported to PDF');
  } catch (error) {
    console.error('Export to PDF failed:', error);
    alert('Failed to export PDF');
  }
};