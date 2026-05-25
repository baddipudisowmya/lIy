package com.liy.model;

import java.util.List;
import java.util.Map;

public class Assessment {

    private int readinessPercent;
    private List<String> observations;
    private List<String> suggestions;
    private Map<String, Integer> mcqScores;
    private Map<String, String> roleReadiness;

    public Assessment() {}

    public int getReadinessPercent() { return readinessPercent; }
    public void setReadinessPercent(int readinessPercent) { this.readinessPercent = readinessPercent; }

    public List<String> getObservations() { return observations; }
    public void setObservations(List<String> observations) { this.observations = observations; }

    public List<String> getSuggestions() { return suggestions; }
    public void setSuggestions(List<String> suggestions) { this.suggestions = suggestions; }

    public Map<String, Integer> getMcqScores() { return mcqScores; }
    public void setMcqScores(Map<String, Integer> mcqScores) { this.mcqScores = mcqScores; }

    public Map<String, String> getRoleReadiness() { return roleReadiness; }
    public void setRoleReadiness(Map<String, String> roleReadiness) { this.roleReadiness = roleReadiness; }
}
