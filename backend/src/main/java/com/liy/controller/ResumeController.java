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
import com.liy.service.DocumentParserService;

@RestController
@RequestMapping("/api")
public class ResumeController {

    private final DocumentParserService documentParserService;
    private final LlmService llmService;
    private final McqService mcqService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ResumeController(DocumentParserService documentParserService, LlmService llmService, McqService mcqService) {
        this.documentParserService = documentParserService;
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
            @RequestParam("roles") List<String> roles,
            @RequestParam(value = "experience", required = false, defaultValue = "0") String experience) {
        try {
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Please upload a resume file"));
            }
            String filename = file.getOriginalFilename();
            if (filename == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "File name is missing"));
            }

            String lowerFilename = filename.toLowerCase();
            if (!lowerFilename.matches(".*\\.(pdf|doc|docx|txt)$")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Only PDF, DOC, DOCX, and TXT files are accepted"));
            }

            // Step 1: Extract text from document
            String resumeText = documentParserService.extractText(file);
            if (resumeText.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Could not extract text from the uploaded file"));
            }

            // Step 2: LLM Call 1 - Analyze resume into structured JSON
            String analysisJson = llmService.analyzeResume(resumeText, roles, experience);

            // Step 3: LLM Call 2 - Generate pass/fail verdict
            String verdictJson = llmService.generateVerdict(analysisJson, roles, experience);

            // Build response
            Map<String, Object> response = new HashMap<>();
            response.put("resumeAnalysis", parseJsonSafe(analysisJson));
            response.put("verdict", parseJsonSafe(verdictJson));
            response.put("resumeAnalysisJson", analysisJson);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("analyzeResume exception: " + e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Analysis failed: " + e.getClass().getSimpleName() + ": " + e.getMessage()));
        }
    }

    private String buildAnalysisForResume(String resumeText, List<String> roles) {
        Map<String, Object> analysis = new LinkedHashMap<>();

        // Extract skills from resume text
        List<String> skills = new ArrayList<>();
        if (resumeText.toLowerCase().contains("java")) skills.add("Java");
        if (resumeText.toLowerCase().contains("python")) skills.add("Python");
        if (resumeText.toLowerCase().contains("javascript")) skills.add("JavaScript");
        if (resumeText.toLowerCase().contains("spring boot")) skills.add("Spring Boot");
        if (resumeText.toLowerCase().contains("react")) skills.add("React");
        if (resumeText.toLowerCase().contains("node")) skills.add("Node.js");
        if (resumeText.toLowerCase().contains("docker")) skills.add("Docker");
        if (resumeText.toLowerCase().contains("sql")) skills.add("SQL");
        if (resumeText.toLowerCase().contains("git")) skills.add("Git");
        if (resumeText.toLowerCase().contains("aws")) skills.add("AWS");
        if (resumeText.toLowerCase().contains("rest api")) skills.add("REST APIs");
        if (resumeText.toLowerCase().contains("microservice")) skills.add("Microservices");
        if (resumeText.toLowerCase().contains("mongodb")) skills.add("MongoDB");
        if (resumeText.toLowerCase().contains("jenkins")) skills.add("Jenkins");

        // Build experience entries
        List<Map<String, String>> experience = new ArrayList<>();
        experience.add(Map.of(
            "role", "Professional Developer",
            "company", "Various Organizations",
            "duration", "3+ years",
            "description", "Hands-on development experience with multiple technologies"
        ));

        // Build strengths
        List<String> strengths = new ArrayList<>(List.of(
            "Core programming skills",
            "Problem-solving ability",
            "Code quality awareness",
            "Team collaboration"
        ));

        // Build missing requirements per role
        Map<String, List<String>> missingRequirements = new LinkedHashMap<>();
        for (String role : roles) {
            switch(role.toLowerCase()) {
                case "sde":
                    missingRequirements.put(role, List.of("Advanced system design", "Distributed systems experience"));
                    break;
                case "fde":
                    missingRequirements.put(role, List.of("Modern framework expertise", "State management patterns"));
                    break;
                case "backend_dev":
                    missingRequirements.put(role, List.of("Microservices architecture", "Cache management"));
                    break;
                default:
                    missingRequirements.put(role, List.of("Specialized experience", "Advanced concepts"));
            }
        }

        analysis.put("skills", skills);
        analysis.put("experience", experience);
        analysis.put("strengths", strengths);
        analysis.put("missingRequirements", missingRequirements);

        try {
            return objectMapper.writeValueAsString(analysis);
        } catch (Exception e) {
            return "{}";
        }
    }

    private String buildVerdictForRoles(List<String> roles) {
        Map<String, Map<String, Object>> roleVerdicts = new LinkedHashMap<>();

        for (String role : roles) {
            Map<String, Object> verdict = new LinkedHashMap<>();
            verdict.put("pass", true);
            verdict.put("confidence", 75);

            switch(role.toLowerCase()) {
                case "sde":
                    verdict.put("keyStrengths", List.of("Core programming skills", "Problem-solving ability", "Code quality awareness"));
                    verdict.put("keyGaps", List.of("Advanced system design", "Distributed systems experience"));
                    verdict.put("summary", "Strong technical foundation with excellent core skills. Ready for SDE roles with some system design learning.");
                    break;
                case "fde":
                    verdict.put("keyStrengths", List.of("Frontend concepts", "UI/UX awareness", "JavaScript knowledge"));
                    verdict.put("keyGaps", List.of("Modern framework expertise", "State management patterns"));
                    verdict.put("summary", "Good foundational web development skills. Would benefit from deeper framework experience.");
                    break;
                case "backend_dev":
                    verdict.put("keyStrengths", List.of("Server-side logic", "Database understanding", "API design basics"));
                    verdict.put("keyGaps", List.of("Microservices architecture", "Cache management"));
                    verdict.put("summary", "Solid backend fundamentals. Growth opportunities in scalability patterns.");
                    break;
                case "data_scientist":
                    verdict.put("keyStrengths", List.of("Analytical thinking", "Statistics basics", "Problem decomposition"));
                    verdict.put("keyGaps", List.of("Machine learning frameworks", "Big data tools"));
                    verdict.put("summary", "Analytical mindset present. Would benefit from ML framework and big data tool experience.");
                    break;
                case "devops":
                    verdict.put("keyStrengths", List.of("Infrastructure thinking", "Automation mindset", "Deployment basics"));
                    verdict.put("keyGaps", List.of("Containerization experience", "CI/CD pipeline management"));
                    verdict.put("summary", "Good DevOps fundamentals. Needs hands-on Docker and Kubernetes experience.");
                    break;
                case "ml_engineer":
                    verdict.put("keyStrengths", List.of("Mathematical foundation", "Algorithm understanding", "Data handling"));
                    verdict.put("keyGaps", List.of("Deep learning frameworks", "Model deployment experience"));
                    verdict.put("summary", "Strong fundamentals in ML concepts. Practical experience with modern frameworks needed.");
                    break;
                case "mobile_dev":
                    verdict.put("keyStrengths", List.of("Mobile app concepts", "User interaction design", "Performance awareness"));
                    verdict.put("keyGaps", List.of("Platform-specific expertise", "Advanced native features"));
                    verdict.put("summary", "Mobile development basics understood. Platform specialization would strengthen candidacy.");
                    break;
                case "cloud_architect":
                    verdict.put("keyStrengths", List.of("System architecture thinking", "Scalability understanding", "Cloud concepts"));
                    verdict.put("keyGaps", List.of("Multi-cloud experience", "Cost optimization expertise"));
                    verdict.put("summary", "Strong architectural foundation. Broader multi-cloud experience would be valuable.");
                    break;
                case "cybersecurity":
                    verdict.put("keyStrengths", List.of("Security awareness", "Network basics", "Authentication concepts"));
                    verdict.put("keyGaps", List.of("Penetration testing skills", "Vulnerability assessment experience"));
                    verdict.put("summary", "Security fundamentals present. Hands-on security testing experience recommended.");
                    break;
                case "test_dev":
                    verdict.put("keyStrengths", List.of("Testing mindset", "QA processes understanding", "Automation basics"));
                    verdict.put("keyGaps", List.of("Advanced test automation", "Performance testing tools"));
                    verdict.put("summary", "Solid QA foundation. Advanced automation frameworks would enhance candidacy.");
                    break;
                default:
                    verdict.put("keyStrengths", List.of("Core technical skills", "Problem-solving", "Learning ability"));
                    verdict.put("keyGaps", List.of("Specialized experience", "Advanced concepts"));
                    verdict.put("summary", "Demonstrates foundational competencies for this role.");
            }

            roleVerdicts.put(role, verdict);
        }

        try {
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("roleVerdicts", roleVerdicts);
            return objectMapper.writeValueAsString(response);
        } catch (Exception e) {
            return "{\"roleVerdicts\": {}}";
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
        return ResponseEntity.ok(Map.of("status", "UP", "app", "LIY - Let's Interview You", "timestamp", System.currentTimeMillis()));
    }

    /**
     * GET /api/test-verdict
     * Test endpoint for verdict response
     */
    @GetMapping("/test-verdict")
    public ResponseEntity<?> testVerdict() {
        Map<String, Object> verdict = new LinkedHashMap<>();
        Map<String, Object> roleVerdict = new LinkedHashMap<>();
        roleVerdict.put("pass", true);
        roleVerdict.put("confidence", 85);
        roleVerdict.put("keyStrengths", List.of("Coding", "Design", "Problem-solving"));
        roleVerdict.put("keyGaps", List.of("System design", "Scaling"));
        roleVerdict.put("summary", "Strong candidate");
        verdict.put("roleVerdicts", Map.of("sde", roleVerdict));
        return ResponseEntity.ok(verdict);
    }

    private Object parseJsonSafe(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return Map.of("raw", json);
        }
    }
}
