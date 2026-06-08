import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Printer } from 'lucide-react';

interface BarcodeDisplayProps {
  value: string;
  productName: string;
  price?: number;
}

export default function BarcodeDisplay({ value, productName, price }: BarcodeDisplayProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      JsBarcode(svgRef.current, value, {
        format: 'CODE128',
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 12,
        margin: 8,
        background: '#ffffff',
        lineColor: '#000000',
      });
    }
  }, [value]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const svgContent = svgRef.current?.outerHTML || '';
    const priceText = price
      ? `<p style="margin:2px 0;font-size:13px;font-weight:bold;">${price.toLocaleString('vi-VN')}₫</p>`
      : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>In mã vạch - ${productName}</title>
          <style>
            body { margin: 0; padding: 10px; font-family: Arial, sans-serif; }
            .label { display: inline-block; border: 1px solid #ddd; padding: 8px 12px; border-radius: 6px; text-align: center; margin: 4px; }
            .label p { margin: 2px 0; font-size: 12px; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            svg { display: block; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="label">
            <p style="font-weight:bold;font-size:12px;">${productName}</p>
            ${priceText}
            ${svgContent}
          </div>
          <script>window.onload = () => { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-white border rounded-xl">
      <p className="text-sm font-medium text-gray-600 text-center">{productName}</p>
      <svg ref={svgRef} />
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm font-medium transition-colors"
      >
        <Printer size={16} />
        In mã vạch
      </button>
    </div>
  );
}
