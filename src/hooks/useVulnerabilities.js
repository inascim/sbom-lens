/**
 * useVulnerabilities Hook
 *
 * Manages vulnerability data linked to PURLs (Package URLs)
 * Vulnerabilities are component-based, so they apply across all SBOMs containing that component
 *
 * Data Structure:
 *   Vulnerability {
 *     id: string (uuid),
 *     purl: string (package url - e.g., "pkg:npm/react@18.2.0"),
 *     cveId: string,
 *     severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
 *     status: "NOT_STARTED" | "IN_PROGRESS" | "REMEDIATED",
 *     patchAvailable: boolean,
 *     notes: string,
 *     timeline: Array,
 *     source: string (NVD, GitHub, OSV, Manual),
 *     publishedDate: timestamp,
 *     lastUpdated: timestamp
 *   }
 *
 * Usage:
 *   const { vulnerabilities, addVulnerability, updateStatus, ... } = useVulnerabilities();
 */

import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { DATA_SOURCE } from "config/dataSource";

const VULNERABILITY_STORAGE_KEY = "sbom_vulnerabilities";

/**
 * Get all vulnerabilities from storage
 */
const getAllVulnerabilities = () => {
  try {
    const data = localStorage.getItem(VULNERABILITY_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading vulnerabilities from storage:", error);
    return [];
  }
};

/**
 * Save vulnerabilities to storage
 */
const saveVulnerabilities = (vulns) => {
  try {
    localStorage.setItem(VULNERABILITY_STORAGE_KEY, JSON.stringify(vulns));
  } catch (error) {
    console.error("Error saving vulnerabilities to storage:", error);
  }
};

export const useVulnerabilities = () => {
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load vulnerabilities on mount
  useEffect(() => {
    const loadVulnerabilities = async () => {
      try {
        setLoading(true);
        setError(null);

        if (DATA_SOURCE === "localStorage") {
          const data = getAllVulnerabilities();
          setVulnerabilities(data);
        } else {
          // TODO: Replace with API call when migrating to backend
          // const response = await fetch(`${API_CONFIG.endpoint}/vulnerabilities`);
          // const data = await response.json();
          // setVulnerabilities(data.vulnerabilities);
        }
      } catch (err) {
        setError(err.message);
        console.error("Error loading vulnerabilities:", err);
      } finally {
        setLoading(false);
      }
    };

    loadVulnerabilities();
  }, []);

  /**
   * Add new vulnerability
   */
  const addVulnerability = useCallback(
    (vulnData) => {
      try {
        setError(null);

        if (DATA_SOURCE === "localStorage") {
          const vuln = {
            id: uuidv4(),
            purl: vulnData.purl,
            cveId: vulnData.cveId,
            severity: vulnData.severity || "MEDIUM",
            status: vulnData.status || "NOT_STARTED",
            patchAvailable: vulnData.patchAvailable || false,
            notes: vulnData.notes || "",
            source: vulnData.source || "Manual",
            publishedDate: vulnData.publishedDate || new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            timeline: [
              {
                status: vulnData.status || "NOT_STARTED",
                date: new Date().toISOString(),
                user: "System",
                notes: "Created",
              },
            ],
          };

          const updated = [...vulnerabilities, vuln];
          setVulnerabilities(updated);
          saveVulnerabilities(updated);
          return vuln;
        }
        // TODO: API call here
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [vulnerabilities]
  );

  /**
   * Update vulnerability status
   * Adds entry to timeline
   */
  const updateVulnerabilityStatus = useCallback(
    (vulnId, newStatus, notes = "") => {
      try {
        setError(null);

        if (DATA_SOURCE === "localStorage") {
          const updated = vulnerabilities.map((v) => {
            if (v.id === vulnId) {
              return {
                ...v,
                status: newStatus,
                lastUpdated: new Date().toISOString(),
                timeline: [
                  ...v.timeline,
                  {
                    status: newStatus,
                    date: new Date().toISOString(),
                    user: "Current User", // TODO: Get from auth context
                    notes: notes || `Status changed to ${newStatus}`,
                  },
                ],
              };
            }
            return v;
          });

          setVulnerabilities(updated);
          saveVulnerabilities(updated);
          return updated.find((v) => v.id === vulnId);
        }
        // TODO: API call here
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [vulnerabilities]
  );

  /**
   * Delete vulnerability
   */
  const deleteVulnerability = useCallback(
    (vulnId) => {
      try {
        setError(null);

        if (DATA_SOURCE === "localStorage") {
          const updated = vulnerabilities.filter((v) => v.id !== vulnId);
          setVulnerabilities(updated);
          saveVulnerabilities(updated);
        }
        // TODO: API call here
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [vulnerabilities]
  );

  /**
   * Get vulnerabilities for a specific PURL
   * (used when viewing a component across multiple SBOMs)
   */
  const getVulnerabilitiesForPURL = useCallback(
    (purl) => {
      return vulnerabilities.filter((v) => v.purl === purl);
    },
    [vulnerabilities]
  );

  /**
   * Get vulnerabilities for multiple PURLs
   * (used when viewing selected SBOMs)
   */
  const getVulnerabilitiesForPURLs = useCallback(
    (purls) => {
      return vulnerabilities.filter((v) => purls.includes(v.purl));
    },
    [vulnerabilities]
  );

  /**
   * Clear all vulnerabilities
   */
  const clearAll = useCallback(() => {
    if (window.confirm("Are you sure? This will delete all vulnerabilities.")) {
      if (DATA_SOURCE === "localStorage") {
        setVulnerabilities([]);
        saveVulnerabilities([]);
      }
      // TODO: API call here
    }
  }, []);

  /**
   * Import vulnerabilities (batch)
   */
  const importVulnerabilities = useCallback(
    (vulnArray) => {
      try {
        setError(null);

        if (DATA_SOURCE === "localStorage") {
          const newVulns = vulnArray.map((v) => ({
            id: uuidv4(),
            ...v,
            lastUpdated: new Date().toISOString(),
            timeline: v.timeline || [
              {
                status: v.status || "NOT_STARTED",
                date: new Date().toISOString(),
                user: "System",
                notes: "Imported",
              },
            ],
          }));

          const updated = [...vulnerabilities, ...newVulns];
          setVulnerabilities(updated);
          saveVulnerabilities(updated);
          return newVulns;
        }
        // TODO: API call here
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [vulnerabilities]
  );

  return {
    vulnerabilities,
    loading,
    error,
    addVulnerability,
    updateVulnerabilityStatus,
    deleteVulnerability,
    getVulnerabilitiesForPURL,
    getVulnerabilitiesForPURLs,
    clearAll,
    importVulnerabilities,
  };
};
