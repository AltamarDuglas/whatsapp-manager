/**
 * ============================================================================
 * ARCHIVO: components/ContactManager/ExcelUploadModal.js
 * DESCRIPCIÓN: Modal avanzado para importar contactos desde archivos Excel (.xlsx/.xls) y CSV.
 * FUNCIONALIDADES:
 *   1. Selección de archivo con previsualización de metadatos (nombre, peso).
 *   2. Selección de categoría existente ("Reinas", "VIP", "Secretaría", etc.).
 *   3. Creación inmediata de una nueva categoría en la base de datos en caliente.
 *   4. Opción para forzar la categoría elegida a todas las filas del archivo.
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * REGLA ESTRICTA: Cero emojis. 100% vectores SVG limpios de Lucide.
 * ============================================================================
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileSpreadsheet,
  Upload,
  Crown,
  Star,
  Building2,
  Users,
  Tag,
  Plus,
  Check,
  AlertCircle,
  Loader2,
  Database,
  CheckCircle2
} from 'lucide-react';

export default function ExcelUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
  initialCategory = 'Reinas'
}) {
  // Estado del archivo seleccionado
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Lista de categorías disponibles cargadas desde la BD
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [overrideCategory, setOverrideCategory] = useState(true);

  // Estado para la creación de una nueva categoría en línea
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#ec4899');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Estado de carga e informe de resultado
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Paleta de colores predefinida para nuevas categorías
  const colorPalette = [
    { label: 'Rosa', hex: '#ec4899' },
    { label: 'Dorado', hex: '#f59e0b' },
    { label: 'Azul', hex: '#3b82f6' },
    { label: 'Esmeralda', hex: '#10b981' },
    { label: 'Púrpura', hex: '#8b5cf6' },
    { label: 'Naranja', hex: '#f97316' },
    { label: 'Cian', hex: '#06b6d4' }
  ];

  // Cargar categorías existentes desde el servidor
  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCategories(data.data);
      }
    } catch (err) {
      console.warn('[ExcelUploadModal] Error cargando categorías:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      setSelectedCategory(initialCategory || 'Reinas');
      setFeedback(null);
      setIsCreatingCategory(false);
    }
  }, [isOpen, initialCategory]);

  if (!isOpen) return null;

  // Manejo de selección de archivo en el input
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFeedback(null);
    }
  };

  // Crear una nueva categoría y seleccionarla inmediatamente
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setFeedback({ success: false, message: 'Ingresa un nombre para la nueva categoría.' });
      return;
    }

    setIsSavingCategory(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatName.trim(),
          color: newCatColor,
          description: newCatDesc.trim()
        })
      });
      const data = await res.json();

      if (data.success && data.data) {
        // Actualizamos la lista local y la seleccionamos
        setCategories((prev) => [...prev, data.data]);
        setSelectedCategory(data.data.name);
        setIsCreatingCategory(false);
        setNewCatName('');
        setNewCatDesc('');
        setFeedback({
          success: true,
          message: `Categoría "${data.data.name}" creada y seleccionada para la importación.`
        });
      } else {
        setFeedback({
          success: false,
          message: data.error || 'No se pudo crear la categoría.'
        });
      }
    } catch (err) {
      setFeedback({ success: false, message: 'Error de red al guardar la nueva categoría.' });
    } finally {
      setIsSavingCategory(false);
    }
  };

  // Ejecutar la importación del archivo hacia la API
  const handleProcessUpload = async () => {
    if (!selectedFile) {
      setFeedback({ success: false, message: 'Selecciona un archivo Excel (.xlsx/.xls) o CSV antes de continuar.' });
      return;
    }

    setIsUploading(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('defaultCategory', selectedCategory || 'General');
      formData.append('overrideCategory', overrideCategory ? 'true' : 'false');

      const res = await fetch('/api/contacts/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        setFeedback({
          success: true,
          message: `¡Importación exitosa! Se guardaron ${data.summary.validCount} contactos asignados a "${selectedCategory}" en la base de datos (${data.summary.invalidCount} inválidos omitidos).`
        });

        // Notificamos al componente padre para refrescar listas
        if (onUploadSuccess) {
          onUploadSuccess(data);
        }

        // Cerramos el modal tras 2 segundos si todo salió bien
        setTimeout(() => {
          onClose();
          setSelectedFile(null);
          setFeedback(null);
        }, 2200);
      } else {
        setFeedback({
          success: false,
          message: data.error || 'Error al procesar el archivo Excel.'
        });
      }
    } catch (err) {
      setFeedback({
        success: false,
        message: 'Ocurrió un error de red al subir el archivo.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Helper para asignar icono vectorial según categoría
  const getCategoryIcon = (name) => {
    const lower = String(name).toLowerCase();
    if (lower.includes('reina')) return <Crown size={14} color="#f472b6" />;
    if (lower.includes('vip')) return <Star size={14} color="#fbbf24" />;
    if (lower.includes('secretar')) return <Building2 size={14} color="#60a5fa" />;
    if (lower.includes('líder') || lower.includes('lider')) return <Users size={14} color="#34d399" />;
    return <Tag size={14} color="#8696a0" />;
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 150,
      padding: 16
    }}>
      <div style={{
        width: '100%',
        maxWidth: 580,
        maxHeight: '92vh',
        overflowY: 'auto',
        backgroundColor: 'var(--wa-bg-panel)',
        border: '1px solid var(--wa-border)',
        borderRadius: 12,
        padding: 24,
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: 20
      }}>
        {/* Cabecera del Modal */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--wa-border)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              backgroundColor: 'rgba(0, 168, 132, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00a884'
            }}>
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--wa-text-primary)' }}>
                Importar Contactos desde Excel
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--wa-text-secondary)' }}>
                Clasifica los números para filtrarlos en la base de datos de la Secretaría.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--wa-text-muted)',
              cursor: 'pointer',
              padding: 4
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Sección 1: Selección del Archivo */}
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--wa-text-primary)', marginBottom: 8 }}>
            1. Archivo Excel (.xlsx / .xls) o CSV
          </label>

          {selectedFile ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              backgroundColor: 'var(--wa-bg-hover)',
              border: '1px solid var(--wa-border)',
              borderRadius: 8
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
                <FileSpreadsheet size={24} color="#00a884" style={{ flexShrink: 0 }} />
                <div style={{ overflow: 'hidden' }}>
                  <p style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--wa-text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {selectedFile.name}
                  </p>
                  <p style={{ fontSize: '0.74rem', color: 'var(--wa-text-muted)' }}>
                    {(selectedFile.size / 1024).toFixed(1)} KB &bull; Listo para procesar
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--wa-green)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--wa-border)',
                borderRadius: 8,
                padding: '24px 16px',
                textAlign: 'center',
                backgroundColor: 'rgba(255,255,255,0.015)',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease'
              }}
            >
              <Upload size={28} color="#00a884" style={{ margin: '0 auto 8px auto' }} />
              <p style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--wa-text-primary)' }}>
                Haz clic para seleccionar tu archivo Excel
              </p>
              <p style={{ fontSize: '0.74rem', color: 'var(--wa-text-muted)', marginTop: 4 }}>
                Compatible con formatos .xlsx, .xls y .csv (detecta columnas de teléfono, nombre, cargo)
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        {/* Sección 2: Selección y Gestión de Categoría */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--wa-text-primary)' }}>
              2. ¿Qué categoría deseas asignar a estos contactos?
            </label>

            <button
              type="button"
              onClick={() => setIsCreatingCategory(!isCreatingCategory)}
              disabled={isUploading}
              style={{
                background: 'none',
                border: 'none',
                color: '#00a884',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Plus size={14} />
              <span>{isCreatingCategory ? 'Ver categorías existentes' : 'Crear nueva categoría'}</span>
            </button>
          </div>

          {/* Formulario desplegable para crear una nueva categoría */}
          {isCreatingCategory ? (
            <div style={{
              backgroundColor: 'rgba(0, 168, 132, 0.05)',
              border: '1px solid rgba(0, 168, 132, 0.25)',
              borderRadius: 8,
              padding: 14,
              marginBottom: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--wa-text-secondary)', marginBottom: 4 }}>
                  Nombre de la nueva categoría:
                </label>
                <input
                  type="text"
                  placeholder="Ej: Candidatas 2026, Patrocinadores, Prensa..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  disabled={isSavingCategory}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'var(--wa-bg-input)',
                    border: '1px solid var(--wa-border)',
                    borderRadius: 6,
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--wa-text-secondary)', marginBottom: 6 }}>
                  Color del distintivo:
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {colorPalette.map((col) => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => setNewCatColor(col.hex)}
                      title={col.label}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: col.hex,
                        border: newCatColor === col.hex ? '2px solid #ffffff' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: newCatColor === col.hex ? '0 0 8px ' + col.hex : 'none'
                      }}
                    >
                      {newCatColor === col.hex && <Check size={12} color="#ffffff" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--wa-text-secondary)', marginBottom: 4 }}>
                  Descripción breve (opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ej: Aspirantes al reinado barrial del río"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  disabled={isSavingCategory}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'var(--wa-bg-input)',
                    border: '1px solid var(--wa-border)',
                    borderRadius: 6,
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(false)}
                  disabled={isSavingCategory}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    backgroundColor: 'transparent',
                    border: '1px solid var(--wa-border)',
                    color: 'var(--wa-text-secondary)',
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={isSavingCategory || !newCatName.trim()}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    backgroundColor: '#00a884',
                    border: 'none',
                    color: '#111b21',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {isSavingCategory ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={2.5} />}
                  <span>Guardar y Seleccionar</span>
                </button>
              </div>
            </div>
          ) : (
            /* Lista de categorías seleccionables */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: 8,
              maxHeight: 160,
              overflowY: 'auto',
              padding: 4
            }}>
              {categories.map((cat) => {
                const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
                return (
                  <button
                    key={cat.id || cat.name}
                    type="button"
                    onClick={() => setSelectedCategory(cat.name)}
                    disabled={isUploading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 8,
                      backgroundColor: isSelected ? 'rgba(0, 168, 132, 0.15)' : 'var(--wa-bg-hover)',
                      border: isSelected ? '1px solid #00a884' : '1px solid var(--wa-border)',
                      color: isSelected ? '#ffffff' : 'var(--wa-text-primary)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: isSelected ? 600 : 400,
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: cat.color || '#00a884',
                      flexShrink: 0
                    }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {cat.name}
                    </span>
                    {getCategoryIcon(cat.name)}
                  </button>
                );
              })}
            </div>
          )}

          {/* Opciones de asignación a todas las filas */}
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              id="overrideCatCheck"
              type="checkbox"
              checked={overrideCategory}
              onChange={(e) => setOverrideCategory(e.target.checked)}
              disabled={isUploading}
              style={{ cursor: 'pointer', accentColor: '#00a884', width: 16, height: 16 }}
            />
            <label htmlFor="overrideCatCheck" style={{ fontSize: '0.8rem', color: 'var(--wa-text-secondary)', cursor: 'pointer' }}>
              Asignar <strong>"{selectedCategory}"</strong> a todos los contactos del archivo (recomendado)
            </label>
          </div>
        </div>

        {/* Mensaje de retroalimentación (éxito o error) */}
        {feedback && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 8,
            backgroundColor: feedback.success ? 'rgba(0, 168, 132, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: feedback.success ? '1px solid rgba(0, 168, 132, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
            color: feedback.success ? '#00a884' : '#f87171',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            {feedback.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Botones de Acción */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--wa-border)', paddingTop: 16 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              backgroundColor: 'transparent',
              border: '1px solid var(--wa-border)',
              color: 'var(--wa-text-secondary)',
              fontSize: '0.84rem',
              fontWeight: 500,
              cursor: isUploading ? 'not-allowed' : 'pointer'
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleProcessUpload}
            disabled={isUploading || !selectedFile}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 20px',
              borderRadius: 8,
              backgroundColor: selectedFile && !isUploading ? '#00a884' : 'var(--wa-bg-hover)',
              color: selectedFile && !isUploading ? '#111b21' : 'var(--wa-text-muted)',
              border: 'none',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: selectedFile && !isUploading ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.15s ease'
            }}
          >
            {isUploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Procesando e Importando...</span>
              </>
            ) : (
              <>
                <Upload size={16} strokeWidth={2.5} />
                <span>Subir e Importar a "{selectedCategory}"</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
