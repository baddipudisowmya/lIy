package com.liy.model;

import java.util.List;
import java.util.Map;

public class ResumeAnalysis {

    private List<String> skills;
    private List<ExperienceEntry> experience;
    private List<String> strengths;
    private Map<String, List<String>> missingRequirements;

    public ResumeAnalysis() {}

    public List<String> getSkills() { return skills; }
    public void setSkills(List<String> skills) { this.skills = skills; }

    public List<ExperienceEntry> getExperience() { return experience; }
    public void setExperience(List<ExperienceEntry> experience) { this.experience = experience; }

    public List<String> getStrengths() { return strengths; }
    public void setStrengths(List<String> strengths) { this.strengths = strengths; }

    public Map<String, List<String>> getMissingRequirements() { return missingRequirements; }
    public void setMissingRequirements(Map<String, List<String>> missingRequirements) { this.missingRequirements = missingRequirements; }

    public static class ExperienceEntry {
        private String role;
        private String company;
        private String duration;
        private String description;

        public ExperienceEntry() {}

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }

        public String getCompany() { return company; }
        public void setCompany(String company) { this.company = company; }

        public String getDuration() { return duration; }
        public void setDuration(String duration) { this.duration = duration; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }
}
