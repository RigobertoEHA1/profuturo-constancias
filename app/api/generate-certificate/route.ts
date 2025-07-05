import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { readFileSync } from 'fs';
import path from 'path';
import { supabase } from '@/utils/supabaseClient';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const certificateId = searchParams.get('id');

  if (!certificateId) {
    return NextResponse.json({ error: 'Certificate ID is required' }, { status: 400 });
  }

  try {
    // Fetch certificate data from Supabase
    const { data: certificate, error: dbError } = await supabase
      .from('certificados')
      .select('*')
      .eq('id', certificateId)
      .single();

    if (dbError || !certificate) {
      console.error('Error fetching certificate:', dbError);
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    // If a PDF URL exists, redirect to it
    if (certificate.pdf_url) {
      return NextResponse.redirect(certificate.pdf_url);
    }

    // Load the existing PDF template
    const pdfPath = path.resolve(process.cwd(), 'public', '6606202546RH-1.pdf');
    const existingPdfBytes = readFileSync(pdfPath);

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Prepare data for the certificate
    const fullName = [
      certificate.first_name,
      certificate.middle_name,
      certificate.paternal_last_name,
      certificate.maternal_last_name
    ].filter(Boolean).join(' ');

    const courseName = certificate.certificate; // Assuming 'certificate' field holds the course name
    const dateIssued = new Date(`${certificate.date_issued}T${certificate.time_issued}`).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const hoursQuantity = certificate.hours_quantity;

    // Define text properties and positions (these will likely need adjustment)
    // You'll need to fine-tune these coordinates based on your PDF template
    const textColor = rgb(0, 0, 0); // Black color

    // Full Name
    firstPage.drawText(fullName, {
      x: 200, // Adjust X coordinate
      y: 380, // Adjust Y coordinate
      font: boldFont,
      size: 18,
      color: textColor,
    });

    // Course Name
    firstPage.drawText(courseName, {
      x: 150, // Adjust X coordinate
      y: 300, // Adjust Y coordinate
      font: font,
      size: 14,
      color: textColor,
    });

    // Date Issued
    firstPage.drawText(dateIssued, {
      x: 200, // Adjust X coordinate
      y: 250, // Adjust Y coordinate
      font: font,
      size: 12,
      color: textColor,
    });

    // Hours Quantity
    firstPage.drawText(String(hoursQuantity), {
      x: 300, // Adjust X coordinate
      y: 250, // Adjust Y coordinate
      font: font,
      size: 12,
      color: textColor,
    });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${certificateId}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
