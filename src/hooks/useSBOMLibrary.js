/**
 * useSBOMLibrary Hook
 *
 * Manages SBOM library state and operations
 * Abstracts localStorage/API implementation
 *
 * Usage:
 *   const { sboms, loading, error, uploadSBOM, getSBOM, deleteSBOM, ... } = useSBOMLibrary();
 */

import { useState, useEffect, useCallback } from "react";
import {
  getAllSBOMs,
  getSBOMById,
  createSBOM,
  updateSBOM,
  deleteSBOM as storageDelete,
  findSBOMByHash,
  computeSBOMHash,
} from "utils/sbomStorage";
import { DATA_SOURCE } from "config/dataSource";

export const useSBOMLibrary = () => {
  const [sboms, setSboms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load SBOMs on mount
  useEffect(() => {
    const loadSBOMs = async () => {
      try {
        setLoading(true);
        setError(null);

        if (DATA_SOURCE === "localStorage") {
          const data = getAllSBOMs();
          setSboms(data);
        } else {
          // TODO: Replace with API call when migrating to backend
          // const response = await fetch(API_CONFIG.endpoint);
          // const data = await response.json();
          // setSboms(data.sboms);
        }
      } catch (err) {
        setError(err.message);
        console.error("Error loading SBOMs:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSBOMs();
  }, []);

  /**
   * Get single SBOM by ID
   */
  const getSBOM = useCallback((sbomId) => {
    if (DATA_SOURCE === "localStorage") {
      return getSBOMById(sbomId);
    }
    // TODO: API call here
  }, []);

  /**
   * Upload/Create new SBOM
   * Includes duplicate detection via hashing
   */
  const uploadSBOM = useCallback(async (sbomData) => {
    try {
      setError(null);

      if (DATA_SOURCE === "localStorage") {
        // Compute hash first
        const hash = await computeSBOMHash({
          components: sbomData.components || [],
          metadata: sbomData.metadata || {},
        });

        // Check for duplicate
        const duplicate = findSBOMByHash(hash);
        if (duplicate) {
          return {
            isDuplicate: true,
            existingSBOM: duplicate,
            message: `SBOM "${duplicate.name}" with identical content already exists.`,
          };
        }

        // Create new SBOM
        const newSBOM = await createSBOM(sbomData);
        setSboms((prev) => [...prev, newSBOM]);
        return { isDuplicate: false, sbom: newSBOM };
      }
      // TODO: API call here
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Update existing SBOM
   */
  const modifySBOM = useCallback(async (sbomId, updates) => {
    try {
      setError(null);

      if (DATA_SOURCE === "localStorage") {
        const updated = await updateSBOM(sbomId, updates);
        setSboms((prev) => prev.map((s) => (s.id === sbomId ? updated : s)));
        return updated;
      }
      // TODO: API call here
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Delete SBOM
   */
  const removeSBOM = useCallback(async (sbomId) => {
    try {
      setError(null);

      if (DATA_SOURCE === "localStorage") {
        storageDelete(sbomId);
        setSboms((prev) => prev.filter((s) => s.id !== sbomId));
      }
      // TODO: API call here
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Get statistics across all SBOMs
   */
  const getStats = useCallback(() => {
    const stats = {
      totalSBOMs: sboms.length,
      totalComponents: sboms.reduce((sum, s) => sum + (s.components?.length || 0), 0),
      recentlyModified:
        sboms.length > 0
          ? [...sboms].sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt))[0]
          : null,
    };
    return stats;
  }, [sboms]);

  return {
    sboms,
    loading,
    error,
    getSBOM,
    uploadSBOM,
    modifySBOM,
    removeSBOM,
    getStats,
  };
};
