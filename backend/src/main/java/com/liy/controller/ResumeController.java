package com.liy.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.liy.model.McqQuestion;
import com.liy.model.McqSubmission;
import com.liy.service.LlmService;
import com.liy.service.McqService;
import com.liy.service.PdfParserService;

@RestController
@RequestMapping("/api")
public class ResumeController {

    private final PdfParserService pdfParserService;
    private final LlmService llmService;
    private final McqService mcqService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ResumeController(PdfParserService pdfParserService, LlmService llmService, McqService mcqService) {
        this.pdfParserService = pdfParserService;
        this.llmService = llmService;
        this.mcqService = mcqService;
    }

    /**
     * POST /api/analyze
     * Upload resume PDF + select roles → LLM Call 1 (Resume Analysis) + LLM Call 2 (Verdict)
     */
    @PostMapping("/analyze")
    
    public ResponseEntity<?> analyzeResume(
            @RequestParam("file") MultipartFile file,
            @RequestParam("roles") List<String> roles) {
        try {
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Please upload a PDF file"));
            }
            String filename = file.getOriginalFilename();
            if (filename == null || !filename.toLowerCase().endsWith(".pdf")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Only PDF files are accepted"));
            }

            // Step 1: Extract text from PDF
            String resumeText = pdfParserService.extractText(file);
            if (resumeText.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Could not extract text from PDF. Is it a scanned image?"));
            }

            // Step 2: LLM Call 1 - Analyze resume into structured JSON
            String analysisJson = llmService.analyzeResume(resumeText, roles);

            // Step 3: LLM Call 2 - Generate pass/fail verdict
            String verdictJson = llmService.generateVerdict(analysisJson, roles);

            // Build response
            Map<String, Object> response = new HashMap<>();
            response.put("resumeAnalysis", parseJsonSafe(analysisJson));
            response.put("verdict", parseJsonSafe(verdictJson));
            response.put("resumeAnalysisJson", analysisJson);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Analysis failed: " + e.getMessage()));
        }
    }

    /**
     * GET /api/mcq/{role}
     * Get MCQ questions for a specific role (without answers)
     */
    @GetMapping("/mcq/{role}")
    public ResponseEntity<?> getMcqQuestions(@PathVariable String role) {
        List<McqQuestion> questions = mcqService.getQuestionsForRole(role);
        if (questions.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(questions);
    }

    /**
     * POST /api/assess
     * Submit MCQ answers → Score + LLM Call 3 (Final Assessment)
     */
    @PostMapping("/assess")
    public ResponseEntity<?> assess(@RequestBody McqSubmission submission) {
        try {
            // Score MCQ answers
            Map<String, Object> mcqResults = mcqService.scoreAnswers(submission.getAnswers());

            @SuppressWarnings("unchecked")
            Map<String, Integer> scores = (Map<String, Integer>) mcqResults.get("scores");

            // LLM Call 3 - Final assessment
            List<String> roles = new ArrayList<>(submission.getAnswers().keySet());
            String assessmentJson = llmService.generateAssessment(
                    submission.getResumeAnalysisJson(),
                    scores,
                    roles
            );

            Map<String, Object> response = new HashMap<>();
            response.put("assessment", parseJsonSafe(assessmentJson));
            response.put("mcqResults", mcqResults);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Assessment failed: " + e.getMessage()));
        }
    }

    /**
     * GET /api/roles
     * Get all available roles
     */
    @GetMapping("/roles")
    public ResponseEntity<?> getRoles() {
        Map<String, String> roles = new LinkedHashMap<>();
        roles.put("sde", "Software Development Engineer (SDE)");
        roles.put("fde", "Frontend Developer (FDE)");
        roles.put("test_dev", "Test/QA Engineer");
        roles.put("data_scientist", "Data Scientist");
        roles.put("devops", "DevOps Engineer");
        roles.put("ml_engineer", "ML Engineer");
        roles.put("backend_dev", "Backend Developer");
        roles.put("mobile_dev", "Mobile Developer");
        roles.put("cloud_architect", "Cloud Architect");
        roles.put("cybersecurity", "Cybersecurity Analyst");
        return ResponseEntity.ok(roles);
    }

    /**
     * GET / or /api
     * Root endpoint redirects to health check
     */
    @GetMapping({"/", "/api"})
    public ResponseEntity<?> root() {
        return ResponseEntity.ok(Map.of("status", "UP", "app", "LIY - Let's Interview You", "message", "Welcome to LIY API"));
    }

    /**
     * GET /api/health
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "app", "LIY - Let's Interview You"));
    }

    private Object parseJsonSafe(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return Map.of("raw", json);
        }
    }
}
