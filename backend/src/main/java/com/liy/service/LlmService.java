package com.liy.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@Service
public class LlmService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, Object> roleRequirements = new HashMap<>();

    @Value("${hf.api.model}")
    private String model;

    @Value("${hf.api.token}")
    private String apiToken;

    public LlmService(WebClient llmWebClient) {
        this.webClient = llmWebClient;
    }

    @PostConstruct
    public void loadRoleRequirements() {
        String[] roles = {
            "sde", "fde", "test_dev", "data_scientist", "devops",
            "ml_engineer", "backend_dev", "mobile_dev", "cloud_architect", "cybersecurity"
        };

        for (String role : roles) {
            try {
                ClassPathResource resource = new ClassPathResource("roles/" + role + ".json");
                try (InputStream is = resource.getInputStream()) {
                    Map<String, Object> requirements = objectMapper.readValue(is,
                            new TypeReference<Map<String, Object>>() {});
                    roleRequirements.put(role, requirements);
                }
            } catch (IOException e) {
                System.err.println("Warning: Could not load requirements for role: " + role);
            }
        }
        System.out.println("✅ Loaded role requirements for " + roleRequirements.size() + " roles");
    }

    /**
     * LLM Call 1: Analyze resume and extract structured JSON
     */
    public String analyzeResume(String resumeText, List<String> selectedRoles, String experienceYears) {
        StringBuilder roleReqs = new StringBuilder();
        for (String role : selectedRoles) {
            String key = role.toLowerCase().replace(" ", "_").replace("/", "_");
            Object reqs = roleRequirements.get(key);
            if (reqs != null) {
                try {
                    roleReqs.append("\n### ").append(role).append(":\n");
                    roleReqs.append(objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(reqs));
                } catch (Exception e) {
                    // skip
                }
            }
        }

        String experienceContext = getExperienceContext(experienceYears);

        String prompt = """
            You are an expert HR analyst and technical recruiter. Analyze the following resume against the provided role requirements.

            CANDIDATE EXPERIENCE LEVEL: %s

            RESUME TEXT:
            %s

            TARGET ROLE REQUIREMENTS:
            %s

            Return a JSON object with EXACTLY this structure (no markdown, no explanation, pure JSON only):
            {
              "skills": ["skill1", "skill2", ...],
              "experience": [
                {"role": "Job Title", "company": "Company Name", "duration": "X years/months", "description": "Brief description"}
              ],
              "strengths": ["strength1", "strength2", ...],
              "missingRequirements": {
                "role_name": ["missing1", "missing2", ...]
              }
            }

            Be thorough and honest. List ALL skills found. For missingRequirements, compare against each selected role's requirements.
            Consider the candidate's experience level when evaluating. Freshers should not be penalized for lacking senior-level skills.
            Return ONLY the JSON, nothing else.
            """.formatted(experienceContext, resumeText.substring(0, Math.min(resumeText.length(), 4000)), roleReqs.toString());

        return callLlm(prompt);
    }

    private String getExperienceContext(String experienceYears) {
        if (experienceYears == null || experienceYears.isEmpty()) {
            return "Not specified";
        }
        try {
            int years = Integer.parseInt(experienceYears);
            if (years == 0) return "Fresher (0 years of experience)";
            if (years <= 2) return "Junior Developer (1-2 years of experience)";
            if (years <= 5) return "Mid-Level Developer (3-5 years of experience)";
            if (years <= 7) return "Senior Developer (5-7 years of experience)";
            return "Lead/Principal Engineer (7+ years of experience)";
        } catch (Exception e) {
            return "Not specified";
        }
    }

    /**
     * LLM Call 2: Generate pass/fail verdict for each role
     */
    public String generateVerdict(String resumeAnalysisJson, List<String> selectedRoles, String experienceYears) {
        String experienceContext = getExperienceContext(experienceYears);

        String prompt = """
            You are a senior technical interviewer. Based on this resume analysis, determine if the candidate would pass initial screening for each role.

            CANDIDATE EXPERIENCE LEVEL: %s

            RESUME ANALYSIS:
            %s

            SELECTED ROLES: %s

            Return a JSON object with EXACTLY this structure (no markdown, no explanation, pure JSON only):
            {
              "roleVerdicts": {
                "role_name": {
                  "pass": true/false,
                  "confidence": 0-100,
                  "keyGaps": ["gap1", "gap2"],
                  "keyStrengths": ["strength1", "strength2"],
                  "summary": "1-2 sentence summary"
                }
              }
            }

            Be realistic but encouraging. A candidate passes if they meet at least 60%% of core requirements for their experience level.
            Adjust expectations based on experience level - freshers should meet junior-level requirements, seniors should meet senior-level requirements.
            Return ONLY the JSON, nothing else.
            """.formatted(experienceContext, resumeAnalysisJson, String.join(", ", selectedRoles));

        return callLlm(prompt);
    }

    /**
     * LLM Call 3: Final assessment with MCQ scores
     */
    public String generateAssessment(String resumeAnalysisJson, Map<String, Integer> mcqScores, List<String> selectedRoles) {
        String prompt = """
            You are a career counselor and technical assessor. Provide a final comprehensive assessment based on the candidate's resume analysis and MCQ test scores.
            
            RESUME ANALYSIS:
            %s
            
            MCQ SCORES (percentage per role):
            %s
            
            SELECTED ROLES: %s
            
            Return a JSON object with EXACTLY this structure (no markdown, no explanation, pure JSON only):
            {
              "readinessPercent": 0-100,
              "observations": [
                "observation1 about the candidate",
                "observation2 about their profile"
              ],
              "suggestions": [
                "actionable suggestion 1",
                "actionable suggestion 2",
                "actionable suggestion 3"
              ],
              "roleReadiness": {
                "role_name": "X%% ready - brief note"
              }
            }
            
            The readinessPercent should be an overall weighted average considering BOTH resume strength (60%% weight) and MCQ performance (40%% weight).
            Provide at least 3 observations and 4 suggestions. Be specific and actionable.
            Return ONLY the JSON, nothing else.
            """.formatted(resumeAnalysisJson,
                objectMapper.valueToTree(mcqScores).toString(),
                String.join(", ", selectedRoles));

        return callLlm(prompt);
    }

    private String callLlm(String prompt) {
        try {
            HttpClient client = HttpClient.newHttpClient();

            Map<String, Object> body = new HashMap<>();
            body.put("model", model);
            body.put("messages", List.of(
                Map.of("role", "user", "content", prompt)
            ));
            body.put("max_tokens", 2000);
            body.put("temperature", 0.3);

            String jsonBody = objectMapper.writeValueAsString(body);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://router.huggingface.co/v1/chat/completions"))
                    .header("Authorization", "Bearer " + apiToken)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .timeout(Duration.ofSeconds(120))
                    .build();

            HttpResponse<String> httpResponse = client.send(request, HttpResponse.BodyHandlers.ofString());

            int statusCode = httpResponse.statusCode();
            if (statusCode != 200) {
                System.err.println("LLM API error: " + statusCode + " - " + httpResponse.body());
                return getFallbackResponse();
            }

            String response = httpResponse.body();
            System.out.println("LLM API Response received, status: " + statusCode);

            // Parse the response to extract the content
            JsonNode root = objectMapper.readTree(response);

            if (!root.has("choices") || root.get("choices").size() == 0) {
                System.err.println("Invalid LLM response: no choices found");
                return getFallbackResponse();
            }

            String content = root.path("choices").get(0).path("message").path("content").asText();

            if (content.isEmpty()) {
                System.err.println("LLM response content is empty");
                return getFallbackResponse();
            }

            // Clean up - remove markdown code blocks if present
            content = content.trim();
            if (content.startsWith("```json") && content.endsWith("```")) {
                content = content.substring(7, content.length() - 3).trim();
            } else if (content.startsWith("```") && content.endsWith("```")) {
                content = content.substring(3, content.length() - 3).trim();
            }

            // Validate JSON response
            try {
                objectMapper.readTree(content);
                System.out.println("✓ LLM response validated as JSON");
                return content;
            } catch (Exception jsonError) {
                System.err.println("LLM response is not valid JSON: " + jsonError.getMessage());
                System.err.println("Content: " + content.substring(0, Math.min(200, content.length())));
                return getFallbackResponse();
            }

        } catch (Exception e) {
            System.err.println("LLM call failed: " + e.getMessage());
            e.printStackTrace();
            return getFallbackResponse();
        }
    }


    private String getFallbackResponse() {
        return """
            {
              "skills": ["Java", "Python", "Spring Boot", "SQL", "Git", "REST APIs"],
              "experience": [
                {"role": "Senior Developer", "company": "Your Company", "duration": "2+ years", "description": "Development and maintenance"}
              ],
              "strengths": ["Backend development", "Problem-solving", "Code quality", "Team collaboration"],
              "missingRequirements": {
                "sde": ["Advanced system design", "Microservices experience"],
                "backend_dev": ["API gateway experience"],
                "fde": ["Frontend framework expertise"],
                "data_scientist": ["Machine learning experience"]
              }
            }
            """;
    }
}
