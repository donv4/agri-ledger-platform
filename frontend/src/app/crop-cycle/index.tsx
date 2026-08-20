// frontend/src/app/crop-cycle/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, FlatList, Alert } from 'react-native';
import { apiService } from '../../services/api';
import { useFarmSync } from '../../hooks/useFarmSync';

interface CropRow {
  id: number;
  farm_id: number;
  crop_type: string;
  planting_date: string;
  harvest_status: string; // 'planted', 'growing', 'harvesting', 'completed'
  days_to_maturity: number;
  companion_crop?: string;
  soil_notes?: string;
}

export default function CropCycleIndex() {
  const { logFarmActivity } = useFarmSync();
  const [rows, setRows] = useState<CropRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('');

  // Track which card is clicked/selected for viewing full details
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  // Form input fields
  const [cropType, setCropType] = useState('');
  const [dtm, setDtm] = useState('75');
  const [companion, setCompanion] = useState('');
  const [soilNotes, setSoilNotes] = useState('');
    // Visual menu option array list tracking variables
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  
  const TEST_FARM_ID = 101;

  useEffect(() => {
    fetchCropRows();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (cropType.trim().length >= 2) {
        triggerEncyclopediaLookup(cropType);
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 400); // Fast 400ms filter processing limit

    return () => clearTimeout(delayDebounce);
  }, [cropType]);

  const triggerEncyclopediaLookup = async (nameStr: string) => {
    const res = await apiService.request(`/api/crop/dictionary-lookup?name=${encodeURIComponent(nameStr)}`, 'GET');
    if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
      setSuggestions(res.data);
      setShowDropdown(true);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  };


  const fetchCropRows = async () => {
    setLoading(true);
    const response = await apiService.getCropRows(TEST_FARM_ID);
    if (response.success && response.data) {
      setRows(response.data);
    } else {
      setRows([
        { id: 1, farm_id: TEST_FARM_ID, crop_type: "Roma Tomatoes", planting_date: "2026-07-20", harvest_status: "growing", days_to_maturity: 75, companion_crop: "Basil & Marigolds", soil_notes: "Prepped bed with compost tea blend" },
        { id: 2, farm_id: TEST_FARM_ID, crop_type: "Sweet Corn", planting_date: "2026-08-10", harvest_status: "planted", days_to_maturity: 85, companion_crop: "Pole Beans", soil_notes: "Heavy nitrogen loader conditioning applied" }
      ]);
    }
    setLoading(false);
  };

  const calculateGrowthProgress = (plantingDateStr: string, totalDays: number): number => {
    try {
      const plantingDate = new Date(plantingDateStr);
      const today = new Date();
      
      // Calculate absolute day intervals between time markers
      const diffTime = Math.abs(today.getTime() - plantingDate.getTime());
      
      // 🌟 FIXED: Changed Math.ceil to Math.floor to prevent same-day rounding leaps
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      const percentage = (diffDays / totalDays) * 100;
      return Math.min(Math.round(percentage), 100); // Caps progress cleanly at 100%
    } catch (e) {
      return 0;
    }
  };


  const handlePlantRow = async () => {
    if (!cropType.trim()) return;
    setSyncStatus('Syncing cultivation map with Cloudflare...');
    const todayStr = new Date().toISOString().split('T')[0];

    const payload = {
      farm_id: TEST_FARM_ID,
      crop_type: cropType.trim(),
      planting_date: todayStr,
      harvest_status: 'planted',
      days_to_maturity: parseInt(dtm, 10) || 75,
      companion_crop: companion.trim() || null,
      soil_notes: soilNotes.trim() || null
    };

    const res = await logFarmActivity('/api/crop/plant', payload);
    if (res?.success) {
      setSyncStatus('✅ New cultivation row logged successfully!');
      setCropType('');
      setCompanion('');
      setSoilNotes('');
      fetchCropRows();
    }
  };

  /**
   * 🔄 ADJUSTMENT ACTION: Modify status or remove crop row
   */
  const handleUpdateStatus = async (rowId: number, nextStatus: string) => {
    setSyncStatus(`Updating row status to ${nextStatus}...`);
    // We send the update mutation directly to our worker pipeline
    const res = await apiService.request('/api/crop/update-status', 'POST', { row_id: rowId, harvest_status: nextStatus, farm_id: TEST_FARM_ID });
    if (res.success) {
      setSyncStatus('✅ Row adjustments saved to the cloud!');
      fetchCropRows();
    } else {
      // Offline fallback state update emulation
      setRows(prev => prev.map(r => r.id === rowId ? { ...r, harvest_status: nextStatus } : r));
      setSyncStatus('⚠️ Offline Mode: Adjusted status locally.');
    }
  };

  const handleRemoveRow = async (rowId: number) => {
    Alert.alert("Remove Row", "Are you sure you want to completely clear out this growing crop bed row?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => {
          setSyncStatus('Clearing cultivation row...');
          const res = await apiService.request('/api/crop/remove', 'POST', { row_id: rowId, farm_id: TEST_FARM_ID });
          if (res.success) {
            setSyncStatus('✅ Row removed from cloud tables.');
            fetchCropRows();
          } else {
            setRows(prev => prev.filter(r => r.id !== rowId));
            setSyncStatus('⚠️ Row cleared locally.');
          }
        }
      }
    ]);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'planted': return { bg: '#E8F5E9', text: '#2E7D32', label: 'Planted' };
      case 'growing': return { bg: '#E3F2FD', text: '#1565C0', label: 'Growing' };
      case 'harvesting': return { bg: '#FFF3E0', text: '#E65100', label: 'Harvesting' };
      default: return { bg: '#ECEFF1', text: '#37474F', label: 'Completed' };
    }
  };

  return (
    <FlatList
      style={styles.container}
      data={rows}
      // 🌟 FIXED: Safe navigation optional chaining stops the undefined.toString() crash instantly!
      keyExtractor={(item) => item?.id ? item.id.toString() : Math.random().toString()}
      ListHeaderComponent={
        <>
          <View style={styles.headerBlock}>
            <Text style={styles.titleHeader}>🌿 CropCycle Crop Manager</Text>
            <Text style={styles.subtitleHeader}>Click on any crop row to view summaries or make edits</Text>
          </View>
          {syncStatus ? (
            <View style={styles.statusBox}><Text style={styles.statusText}>{syncStatus}</Text></View>
          ) : null}
          <Text style={styles.sectionLabel}>Active Cultivation Beds</Text>
        </>
      }
      renderItem={({ item }) => {
        // 🌟 ADDITIONAL SAFETY: Skip rendering if a bad row item ever creeps into the list array
        if (!item) return null;
        
        const isExpanded = expandedRowId === item.id;
        const statusConfig = getStatusConfig(item.harvest_status);
        const progress = calculateGrowthProgress(item.planting_date, item.days_to_maturity);

        return (
          <View style={[styles.rowCard, isExpanded && styles.expandedCardBorder]}>
            {/* CARD MAIN ROW (CLICKABLE ELEMENT) */}
            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={() => setExpandedRowId(isExpanded ? null : item.id)}
              style={styles.cardHeaderPressable}
            >
              <View>
                <Text style={styles.cropTitle}>{item.crop_type}</Text>
                <Text style={styles.metaText}>📅 Planted: {item.planting_date} • Progress: {progress}%</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                <Text style={[styles.statusTextLabel, { color: statusConfig.text }]}>{statusConfig.label}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>

            {/* 📋 EXPANDED DETAILS SUMMARY DRAWER SECTION */}
            {isExpanded && (
              <View style={styles.detailsDrawer}>
                <Text style={styles.drawerSectionTitle}>🌱 Crop Diagnostic Summary</Text>
                
                <View style={styles.detailBox}>
                  <Text style={styles.detailLabel}>🤝 Companion Planting Matrix Guide:</Text>
                  <Text style={styles.detailValue}>{item.companion_crop || 'No specific companions registered.'}</Text>
                </View>

                <View style={styles.detailBox}>
                  <Text style={styles.detailLabel}>🪓 Soil Bed Conditioning Logs:</Text>
                  <Text style={styles.detailValue}>{item.soil_notes || 'No soil amendment logs added yet.'}</Text>
                </View>

                {/* ⚙️ ADJUSTMENT AND EDIT CONTROL BUTTONS */}
                <Text style={styles.drawerSectionTitle}>🛠️ Adjustments & Actions</Text>
                <View style={styles.actionButtonGroup}>
                  {item.harvest_status !== 'growing' && (
                    <TouchableOpacity style={[styles.actionBtn, styles.growBtn]} onPress={() => handleUpdateStatus(item.id, 'growing')}>
                      <Text style={styles.actionBtnText}>Set Growing</Text>
                    </TouchableOpacity>
                  )}
                  {item.harvest_status !== 'harvesting' && (
                    <TouchableOpacity style={[styles.actionBtn, styles.harvestBtn]} onPress={() => handleUpdateStatus(item.id, 'harvesting')}>
                      <Text style={styles.actionBtnText}>Set Harvesting</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.actionBtn, styles.clearBtn]} onPress={() => handleRemoveRow(item.id)}>
                    <Text style={styles.actionBtnText}>Remove Row</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        );
      }}

      ListFooterComponent={
        <View style={styles.formContainer}>
          <Text style={styles.sectionLabel}>Plant New Cultivation Row</Text>
          
          {/* 🔘 WRAP VARIETY INPUT IN A RELATIVE BOX CONTAINER */}
          <View style={{ zIndex: 999, position: 'relative' }}>
            <TextInput 
              style={styles.inputField} 
              placeholder="Crop Variety Name (e.g. Tomato)" 
              value={cropType} 
              onChangeText={setCropType} 
            />
            
            {/* FLOATING AUTOCOMPLETE DROPDOWN */}
            {showDropdown && suggestions.length > 0 && (
              <View style={styles.dropdownContainer}>
                {suggestions.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.dropdownItemRow}
                    onPress={() => {
                      setCropType(item.name);
                      setDtm(item.default_dtm.toString());
                      setCompanion(item.companion || '');
                      setSuggestions([]);
                      setShowDropdown(false);
                      setSyncStatus(`✨ Auto-filled optimized details for ${item.name}!`);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>🌱 {item.name} ({item.default_dtm} Days DTM)</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Keep your remaining inputs exactly as they are below it */}
          <TextInput style={styles.inputField} placeholder="Days to Maturity (e.g. 75)" keyboardType="numeric" value={dtm} onChangeText={setDtm} />
          <TextInput style={styles.inputField} placeholder="Companion Crops (e.g. Basil, Carrots)" value={companion} onChangeText={setCompanion} />
          <TextInput style={styles.inputField} placeholder="Soil Notes (e.g. Planted quicksticks for nitrogen bedding)" value={soilNotes} onChangeText={setSoilNotes} />
          
          <TouchableOpacity style={styles.submitButton} onPress={handlePlantRow}>
            <Text style={styles.submitText}>Commit New Planting Event</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );
}


const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FAFAFA' 
  },
  dropdownContainer: {
    position: 'absolute',
    top: 50, // Floats right below your active entry box lane
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    elevation: 5, // Casts an overlapping drop-shadow layout over background rows on Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 9999,
  },
  dropdownItemRow: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  headerBlock: { 
    backgroundColor: '#E8F5E9', 
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#C8E6C9' 
  },
  titleHeader: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#2E7D32' 
  },
  subtitleHeader: { 
    fontSize: 13, 
    color: '#2E7D32', 
    marginTop: 4 
  },
  statusBox: { 
    margin: 16, 
    padding: 12, 
    backgroundColor: '#ECEFF1', 
    borderRadius: 8 
  },
  statusText: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: '#37474F', 
    textAlign: 'center' 
  },
  sectionLabel: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: '#2E7D32', 
    marginHorizontal: 16, 
    marginTop: 20, 
    marginBottom: 8 
  },
  rowCard: { 
    backgroundColor: '#FFFFFF', 
    marginHorizontal: 16, 
    marginVertical: 6, 
    padding: 16, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#E0E0E0', 
    elevation: 1 
  },
  expandedCardBorder: { 
    borderColor: '#2E7D32', 
    borderWidth: 1.5 
  },
  cardHeaderPressable: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  cropTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#212121' 
  },
  metaText: { 
    fontSize: 12, 
    color: '#757575', 
    marginTop: 4 
  },
  statusBadge: { 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 6 
  },
  statusTextLabel: { 
    fontSize: 11, 
    fontWeight: '700', 
    textTransform: 'uppercase' 
  },
  progressBarBackground: { 
    height: 6, 
    backgroundColor: '#E0E0E0', 
    borderRadius: 3, 
    marginTop: 12, 
    overflow: 'hidden' 
  },
  progressBarFill: { 
    height: '100%', 
    backgroundColor: '#2E7D32' 
  },
  detailsDrawer: { 
    marginTop: 16, 
    paddingTop: 16, 
    borderTopWidth: 1, 
    borderTopColor: '#E0E0E0' 
  },
  drawerSectionTitle: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: '#555', 
    marginBottom: 10, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },
  detailBox: { 
    backgroundColor: '#F9FAFB', 
    padding: 10, 
    borderRadius: 8, 
    marginBottom: 8, 
    borderWidth: 1, 
    borderColor: '#F0F0F0' 
  },
  detailLabel: { 
    fontSize: 11, 
    fontWeight: '600', 
    color: '#718096', 
    marginBottom: 2 
  },
  detailValue: { 
    fontSize: 13, 
    color: '#2D3748', 
    fontWeight: '500' 
  },
  actionButtonGroup: { 
    flexDirection: 'row', 
    gap: 8, 
    marginTop: 4, 
    marginBottom: 10 
  },
  actionBtn: { 
    flex: 1, 
    padding: 10, 
    borderRadius: 6, 
    alignItems: 'center' 
  },
  growBtn: { 
    backgroundColor: '#E3F2FD' 
  },
  harvestBtn: { 
    backgroundColor: '#FFF3E0' 
  },
  clearBtn: { 
    backgroundColor: '#FFEBEE' 
  },
  actionBtnText: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: '#2D3748' 
  },
  formContainer: { 
    padding: 16, 
    marginTop: 10, 
    paddingBottom: 40 
  },
  inputField: { 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1, 
    borderColor: '#E0E0E0', 
    borderRadius: 8, 
    padding: 12, 
    marginBottom: 12, 
    fontSize: 14 
  },
  submitButton: { 
    backgroundColor: '#2E7D32', 
    padding: 16, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 4, 
    elevation: 2 
  },
  disabledButton: { 
    backgroundColor: '#BDBDBD', 
    elevation: 0 
  },
  submitText: { 
    color: '#FFFFFF', 
    fontSize: 15, 
    fontWeight: 'bold' 
  }
});
