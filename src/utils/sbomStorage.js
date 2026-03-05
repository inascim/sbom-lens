/**
 * SBOM Storage Layer
 *
 * Abstraction for SBOM data persistence
 * Currently uses localStorage, but can be swapped for API calls
 *
 * Data Structures:
 *   SBOM {
 *     id: string (uuid),
 *     name: string,
 *     createdAt: timestamp,
 *     modifiedAt: timestamp,
 *     hash: string (sha256),
 *     components: Component[],
 *     metadata: object
 *   }
 *
 *   Component {
 *     purl: string (package url),
 *     name: string,
 *     version: string,
 *     ... (other CycloneDX fields)
 *   }
 */

import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

const SBOM_STORAGE_KEY = "sbom_library";
const MAX_SBOMS = 3;

/**
 * Compute SHA256 hash of SBOM for duplicate detection
 * @param {object} sbom - The SBOM object
 * @returns {string} SHA256 hash
 */
export const computeSBOMHash = (sbom) => {
  // Create a stable string representation (sorted keys)
  const stableString = JSON.stringify(sbom, Object.keys(sbom).sort());

  // For browser environment, use SubtleCrypto API
  // For Node/test environment, use crypto module
  if (typeof window !== "undefined" && window.crypto) {
    // Browser - return a promise-based hash
    const encoder = new TextEncoder();
    const data = encoder.encode(stableString);
    return window.crypto.subtle.digest("SHA-256", data).then((hashBuffer) => {
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      return hashHex;
    });
  } else {
    // Node environment for testing
    return Promise.resolve(crypto.createHash("sha256").update(stableString).digest("hex"));
  }
};

/**
 * Get all SBOMs from storage
 * @returns {SBOM[]}
 */
export const getAllSBOMs = () => {
  try {
    const data = localStorage.getItem(SBOM_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading SBOMs from storage:", error);
    return [];
  }
};

/**
 * Get single SBOM by ID
 * @param {string} sbomId - SBOM ID
 * @returns {SBOM|null}
 */
export const getSBOMById = (sbomId) => {
  const sboms = getAllSBOMs();
  return sboms.find((s) => s.id === sbomId) || null;
};

/**
 * Create new SBOM
 * @param {object} sbomData - SBOM data (name, components, etc.)
 * @returns {SBOM} Created SBOM with ID and timestamps
 */
export const createSBOM = async (sbomData) => {
  const sbom = {
    id: uuidv4(),
    name: sbomData.name || "Untitled SBOM",
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    components: sbomData.components || [],
    metadata: sbomData.metadata || {},
  };

  // Compute hash
  sbom.hash = await computeSBOMHash({
    components: sbom.components,
    metadata: sbom.metadata,
  });

  // Save to storage
  const sboms = getAllSBOMs();
  if (sboms.length >= MAX_SBOMS) {
    throw new Error(
      `Maximum SBOMs (${MAX_SBOMS}) already stored. Please delete one before adding another.`
    );
  }

  sboms.push(sbom);
  localStorage.setItem(SBOM_STORAGE_KEY, JSON.stringify(sboms));

  return sbom;
};

/**
 * Update SBOM
 * @param {string} sbomId - SBOM ID
 * @param {object} updates - Fields to update
 * @returns {SBOM} Updated SBOM
 */
export const updateSBOM = async (sbomId, updates) => {
  const sboms = getAllSBOMs();
  const sbomIndex = sboms.findIndex((s) => s.id === sbomId);

  if (sbomIndex === -1) {
    throw new Error(`SBOM with ID ${sbomId} not found`);
  }

  const sbom = sboms[sbomIndex];
  const updated = {
    ...sbom,
    ...updates,
    id: sbom.id, // Ensure ID doesn't change
    createdAt: sbom.createdAt, // Ensure creation date doesn't change
    modifiedAt: new Date().toISOString(),
  };

  // Recompute hash if components or metadata changed
  if (updates.components || updates.metadata) {
    updated.hash = await computeSBOMHash({
      components: updated.components,
      metadata: updated.metadata,
    });
  }

  sboms[sbomIndex] = updated;
  localStorage.setItem(SBOM_STORAGE_KEY, JSON.stringify(sboms));

  return updated;
};

/**
 * Delete SBOM
 * @param {string} sbomId - SBOM ID
 */
export const deleteSBOM = (sbomId) => {
  const sboms = getAllSBOMs();
  const filtered = sboms.filter((s) => s.id !== sbomId);
  localStorage.setItem(SBOM_STORAGE_KEY, JSON.stringify(filtered));
};

/**
 * Check if SBOM with hash already exists
 * @param {string} hash - SBOM hash
 * @returns {SBOM|null} Existing SBOM if found
 */
export const findSBOMByHash = (hash) => {
  const sboms = getAllSBOMs();
  return sboms.find((s) => s.hash === hash) || null;
};

/**
 * Get count of stored SBOMs
 * @returns {number}
 */
export const getSBOMCount = () => {
  return getAllSBOMs().length;
};

/**
 * Clear all SBOMs (careful! this is destructive)
 */
export const clearAllSBOMs = () => {
  localStorage.removeItem(SBOM_STORAGE_KEY);
};
