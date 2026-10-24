package com.chaingraph.service;

import com.chaingraph.dto.TransactionDto;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
public class ExcelParserService {

    public List<TransactionDto> parseFile(MultipartFile file) throws Exception {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
            return parseExcel(file.getInputStream());
        } else if (filename.endsWith(".csv")) {
            return parseCsv(file.getInputStream());
        } else {
            throw new IllegalArgumentException("Unsupported file format. Please upload .xlsx, .xls or .csv");
        }
    }

    private List<TransactionDto> parseExcel(InputStream is) throws Exception {
        List<TransactionDto> list = new ArrayList<>();
        try (Workbook workbook = WorkbookFactory.create(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            boolean firstRow = true;
            for (Row row : sheet) {
                if (firstRow) {
                    firstRow = false; // skip header
                    continue;
                }
                if (isRowEmpty(row)) continue;

                String txHash = getCellString(row.getCell(0));
                String timestamp = getCellString(row.getCell(1));
                String from = getCellString(row.getCell(2));
                String to = getCellString(row.getCell(3));
                Double amount = getCellDouble(row.getCell(4));
                String symbol = getCellString(row.getCell(5));
                Double gasFee = getCellDouble(row.getCell(6));
                Integer walletAge = getCellInt(row.getCell(7));

                if (txHash != null && from != null && to != null) {
                    list.add(new TransactionDto(txHash, timestamp, from, to, amount, symbol, gasFee, walletAge));
                }
            }
        }
        return list;
    }

    private List<TransactionDto> parseCsv(InputStream is) throws Exception {
        List<TransactionDto> list = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            String line;
            boolean first = true;
            while ((line = reader.readLine()) != null) {
                if (first) {
                    first = false;
                    continue;
                }
                if (line.trim().isEmpty()) continue;
                String[] cols = line.split(",");
                if (cols.length >= 5) {
                    String txHash = cols[0].trim();
                    String timestamp = cols[1].trim();
                    String from = cols[2].trim();
                    String to = cols[3].trim();
                    Double amount = Double.parseDouble(cols[4].trim());
                    String symbol = cols.length > 5 ? cols[5].trim() : "USDT";
                    Double gasFee = cols.length > 6 && !cols[6].trim().isEmpty() ? Double.parseDouble(cols[6].trim()) : 0.001;
                    Integer age = cols.length > 7 && !cols[7].trim().isEmpty() ? Integer.parseInt(cols[7].trim()) : 30;

                    list.add(new TransactionDto(txHash, timestamp, from, to, amount, symbol, gasFee, age));
                }
            }
        }
        return list;
    }

    private boolean isRowEmpty(Row row) {
        if (row == null) return true;
        Cell cell = row.getCell(0);
        return cell == null || cell.getCellType() == CellType.BLANK;
    }

    private String getCellString(Cell cell) {
        if (cell == null) return "";
        if (cell.getCellType() == CellType.STRING) return cell.getStringCellValue().trim();
        if (cell.getCellType() == CellType.NUMERIC) return String.valueOf((long) cell.getNumericCellValue());
        return "";
    }

    private Double getCellDouble(Cell cell) {
        if (cell == null) return 0.0;
        if (cell.getCellType() == CellType.NUMERIC) return cell.getNumericCellValue();
        if (cell.getCellType() == CellType.STRING) {
            try { return Double.parseDouble(cell.getStringCellValue().trim()); } catch (Exception e) { return 0.0; }
        }
        return 0.0;
    }

    private Integer getCellInt(Cell cell) {
        if (cell == null) return 0;
        if (cell.getCellType() == CellType.NUMERIC) return (int) cell.getNumericCellValue();
        if (cell.getCellType() == CellType.STRING) {
            try { return Integer.parseInt(cell.getStringCellValue().trim()); } catch (Exception e) { return 0; }
        }
        return 0;
    }
}
