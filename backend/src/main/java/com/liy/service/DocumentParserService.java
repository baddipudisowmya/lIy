package com.liy.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Service
public class DocumentParserService {

    public String extractText(MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename();
        if (filename == null) {
            throw new IOException("File name is null");
        }

        String lowerFilename = filename.toLowerCase();

        if (lowerFilename.endsWith(".pdf")) {
            return extractFromPdf(file);
        } else if (lowerFilename.endsWith(".txt")) {
            return extractFromText(file);
        } else if (lowerFilename.endsWith(".doc") || lowerFilename.endsWith(".docx")) {
            return extractFromWord(file);
        } else {
            throw new IOException("Unsupported file format. Please upload PDF, DOCX, DOC, or TXT");
        }
    }

    private String extractFromPdf(MultipartFile file) throws IOException {
        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            String text = stripper.getText(document);
            return cleanText(text);
        }
    }

    private String extractFromText(MultipartFile file) throws IOException {
        String text = new String(file.getBytes(), StandardCharsets.UTF_8);
        return cleanText(text);
    }

    private String extractFromWord(MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename();
        if (filename != null && filename.toLowerCase().endsWith(".docx")) {
            return extractFromDocx(file);
        } else {
            return extractFromDoc(file);
        }
    }

    private String extractFromDocx(MultipartFile file) throws IOException {
        try {
            // For DOCX files, we'll use a simple approach - extract text from the XML content
            // DOCX is a ZIP file containing XML files
            byte[] bytes = file.getBytes();

            // Try to extract text from document.xml
            String xmlContent = extractXmlFromZip(bytes, "word/document.xml");

            // Remove XML tags and extract plain text
            String text = xmlContent.replaceAll("<[^>]*>", " ");
            // Decode HTML entities
            text = text.replace("&amp;", "&")
                    .replace("&lt;", "<")
                    .replace("&gt;", ">")
                    .replace("&quot;", "\"")
                    .replace("&apos;", "'");

            return cleanText(text);
        } catch (Exception e) {
            // Fallback: treat as text if parsing fails
            return extractFromText(file);
        }
    }

    private String extractFromDoc(MultipartFile file) throws IOException {
        // For DOC files, we'll attempt basic text extraction
        // DOC is a binary format, so we'll try to extract readable text
        try {
            byte[] bytes = file.getBytes();
            StringBuilder text = new StringBuilder();

            // Extract ASCII-printable characters from the binary file
            for (byte b : bytes) {
                if ((b >= 32 && b <= 126) || b == '\n' || b == '\r' || b == '\t') {
                    text.append((char) b);
                }
            }

            String extracted = text.toString();
            if (extracted.trim().length() < 10) {
                throw new IOException("Could not extract text from DOC file");
            }

            return cleanText(extracted);
        } catch (Exception e) {
            throw new IOException("Failed to extract text from DOC file: " + e.getMessage());
        }
    }

    private String extractXmlFromZip(byte[] zipBytes, String entryName) throws IOException {
        try {
            // Use ZipFile for safer extraction
            java.io.File tempFile = java.io.File.createTempFile("docx", ".zip");
            java.nio.file.Files.write(tempFile.toPath(), zipBytes);

            try (java.util.zip.ZipFile zipFile = new java.util.zip.ZipFile(tempFile)) {
                java.util.zip.ZipEntry entry = zipFile.getEntry(entryName);
                if (entry == null) {
                    throw new IOException("document.xml not found in DOCX");
                }

                try (java.io.InputStream is = zipFile.getInputStream(entry)) {
                    byte[] buffer = new byte[1024];
                    java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
                    int len;
                    while ((len = is.read(buffer)) > 0) {
                        baos.write(buffer, 0, len);
                    }
                    return baos.toString(StandardCharsets.UTF_8);
                }
            } finally {
                tempFile.delete();
            }
        } catch (IOException e) {
            throw e;
        }
    }

    private String cleanText(String text) {
        // Clean up excessive whitespace while preserving structure
        text = text.replaceAll("[ \\t]+", " ");
        text = text.replaceAll("\\n{3,}", "\n\n");
        return text.trim();
    }
}
