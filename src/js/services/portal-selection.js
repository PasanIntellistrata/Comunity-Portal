import { useState, useEffect, useCallback } from 'react';
import { PROPERTIES } from '../data/invoice-data.js';

const STORAGE_KEY_PROP = 'intellistrata_selected_property_id';
const STORAGE_KEY_LOT = 'intellistrata_selected_lot';
const EVENT_CHANGE = 'intellistrata_portal_selection_change';

/**
 * PortalSelectionService
 * Centralized state for the active Property and Lot across all pages of the portal.
 * Persists in localStorage and broadcasts change events across all mounted components.
 */
class PortalSelectionService {
  constructor() {
    this.listeners = new Set();
  }

  getProperty() {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY_PROP);
      if (savedId) {
        const found = PROPERTIES.find((p) => p.id === savedId || p.name === savedId);
        if (found) return found;
      }
    } catch (e) {
      // fallback
    }
    return PROPERTIES[0];
  }

  getLot() {
    try {
      const savedLot = localStorage.getItem(STORAGE_KEY_LOT);
      if (savedLot) {
        const currentProp = this.getProperty();
        if (currentProp.lots && currentProp.lots.includes(savedLot)) {
          return savedLot;
        }
      }
    } catch (e) {
      // fallback
    }
    const currentProp = this.getProperty();
    return currentProp.lots && currentProp.lots.includes('Lot A-03')
      ? 'Lot A-03'
      : currentProp.lots?.[1] || currentProp.lots?.[0] || 'All Lots';
  }

  setProperty(prop) {
    if (!prop) return;
    try {
      localStorage.setItem(STORAGE_KEY_PROP, prop.id);
    } catch (e) {}

    // Check if the current lot exists in the new property's lot list
    const currentLot = this.getLot();
    let newLot = currentLot;
    if (!prop.lots.includes(currentLot)) {
      newLot = prop.lots.includes('Lot A-03')
        ? 'Lot A-03'
        : prop.lots[1] || prop.lots[0] || 'All Lots';
      try {
        localStorage.setItem(STORAGE_KEY_LOT, newLot);
      } catch (e) {}
    }

    this._notify({ property: prop, lot: newLot });
  }

  setLot(lot) {
    if (!lot) return;
    try {
      localStorage.setItem(STORAGE_KEY_LOT, lot);
    } catch (e) {}
    this._notify({ property: this.getProperty(), lot });
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  _notify(data) {
    this.listeners.forEach((fn) => {
      try {
        fn(data);
      } catch (e) {
        console.error('PortalSelection listener error:', e);
      }
    });

    try {
      window.dispatchEvent(new CustomEvent(EVENT_CHANGE, { detail: data }));
    } catch (e) {}
  }
}

export const portalSelection = new PortalSelectionService();

/**
 * usePortalSelection
 * React hook that returns { selectedProperty, selectedLot, setSelectedProperty, setSelectedLot, properties }
 * and stays completely synchronized across all pages in the app.
 */
export const usePortalSelection = () => {
  const [property, setPropertyState] = useState(() => portalSelection.getProperty());
  const [lot, setLotState] = useState(() => portalSelection.getLot());

  useEffect(() => {
    const handleUpdate = ({ property: newProp, lot: newLot }) => {
      if (newProp) setPropertyState(newProp);
      if (newLot) setLotState(newLot);
    };

    const unsubscribe = portalSelection.subscribe(handleUpdate);

    // Cross-tab / cross-window synchronization
    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY_PROP || e.key === STORAGE_KEY_LOT) {
        setPropertyState(portalSelection.getProperty());
        setLotState(portalSelection.getLot());
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setProperty = useCallback((newProp) => {
    portalSelection.setProperty(newProp);
  }, []);

  const setLot = useCallback((newLot) => {
    portalSelection.setLot(newLot);
  }, []);

  return {
    selectedProperty: property,
    selectedLot: lot,
    setSelectedProperty: setProperty,
    setSelectedLot: setLot,
    properties: PROPERTIES,
  };
};
