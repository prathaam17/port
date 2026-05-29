const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const TARGET_URL = 'https://newmangaloreport.gov.in/downloads';
const UPLOADS_DIR = path.join(__dirname, '..', 'backend', 'uploads');

async function downloadPDF() {
  console.log(`Fetching HTML from: ${TARGET_URL}...`);
  try {
    const response = await fetch(TARGET_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch downloads page: ${response.statusText}`);
    }

    const html = await response.text();
    console.log('HTML retrieved successfully. Parsing for PDF links...');

    // Regex to find href links containing .pdf
    const pdfRegex = /href="([^"]+\.pdf)"/gi;
    const matches = [];
    let match;
    while ((match = pdfRegex.exec(html)) !== null) {
      matches.push(match[1]);
    }

    if (matches.length === 0) {
      console.log('No direct PDF links found in the HTML. Trying absolute pattern...');
      const absPdfRegex = /https?:\/\/[^\s"]+\.pdf/gi;
      let absMatch;
      while ((absMatch = absPdfRegex.exec(html)) !== null) {
        matches.push(absMatch[0]);
      }
    }

    if (matches.length === 0) {
      console.error('Could not find any PDF file links on the NMPA downloads page.');
      console.log('Using a standard public port manual/policy PDF as fallback...');
      // Fallback: Use a generic public major port policy or notification document URL
      matches.push('https://newmangaloreport.gov.in/sites/default/files/2023-08/Manual%20for%2520Procurement%20of%20Goods.pdf');
    }

    console.log(`Found PDF links:`, matches.slice(0, 3));
    let pdfUrl = matches[0];

    // Handle relative URLs
    if (!pdfUrl.startsWith('http')) {
      if (pdfUrl.startsWith('/')) {
        pdfUrl = 'https://newmangaloreport.gov.in' + pdfUrl;
      } else {
        pdfUrl = 'https://newmangaloreport.gov.in/' + pdfUrl;
      }
    }

    console.log(`Downloading real NMPA PDF from: ${pdfUrl}...`);
    
    // Resolve redirect URL if necessary (encoded spaces etc)
    pdfUrl = encodeURI(decodeURI(pdfUrl));

    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to download PDF: ${pdfResponse.statusText} (${pdfResponse.status})`);
    }

    const buffer = Buffer.from(await pdfResponse.arrayBuffer());

    // Ensure uploads directory exists
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    // Write it to all our seeded PDF files
    const filesToOverWrite = [
      'manifest_attached.pdf',
      'manifest_crg_001.pdf',
      'coal_bill_of_lading.pdf',
      'cashew_import_permit.pdf',
      'phytosanitary_timber_cert.pdf'
    ];

    for (const filename of filesToOverWrite) {
      const filePath = path.join(UPLOADS_DIR, filename);
      fs.writeFileSync(filePath, buffer);
      console.log(`Successfully saved real PDF to: ${filePath}`);
    }

    console.log('All PDF files replaced with authentic NMPA documents successfully.');

  } catch (error) {
    console.error('Error during download process:', error);
  }
}

downloadPDF();
