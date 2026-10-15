/**
 * ============================================================================
 * ARCHIVO: components/ContactManager/ContactManager.js
 * DESCRIPCIÓN: Directorio maestro de números autorizados en WhatsApp Desktop.
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * REGLA ESTRICTA: Sin emojis. Solo vectores SVG limpios de Lucide.
 * ============================================================================
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Upload,
  Plus,
  Search,
  FileSpreadsheet,
  Crown,
  Star,
  Building2,
  Users,
  Download,
  CheckSquare,
  X,
  Database,
  ShieldCheck
} from 'lucide-react';
import { PhoneFormatter } from '@/src/services/PhoneFormatter';
import CategoryBadge from '../ChatInbox/CategoryBadge';

export default function ContactManager({ onRefreshNeeded }) {
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedPhones, setSelectedPhones] = useState(new Set());
  const [bulkCategory, setBulkCategory] = useState('Reinas');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newContactForm, setNewContactForm] = useState({
    name: '',
    phone: '',
    category: 'Reinas',
    notes: '',
    cargo: ''
  });

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'Todos') {
        params.append('category', selectedCategory);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const res = await fetch(`/api/contacts?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setContacts(data.data || []);
      }
    } catch (err) {
      console.error('[ContactManager] Error al cargar contactos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleToggleSelectAll = () => {
    if (selectedPhones.size === contacts.length) {
      setSelectedPhones(new Set());
    } else {
      setSelectedPhones(new Set(contacts.map((c) => c.phone)));
    }
  };

  const handleTogglePhone = (phone) => {
    const next = new Set(selectedPhones);
    if (next.has(phone)) {
      next.delete(phone);
    } else {
      next.add(phone);
    }
    setSelectedPhones(next);
  };

  const handleApplyBulkCategory = async () => {
    if (selectedPhones.size === 0) return;
    try {
      const res = await fetch('/api/contacts/category', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phones: Array.from(selectedPhones),
          category: bulkCategory
        })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedPhones(new Set());
        await fetchContacts();
        if (onRefreshNeeded) onRefreshNeeded();
      }
    } catch (err) {
      console.error('[ContactManager] Error en asignación masiva:', err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadFeedback(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('defaultCategory', selectedCategory !== 'Todos' ? selectedCategory : 'General');

    try {
      const res = await fetch('/api/contacts/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        setUploadFeedback({
          success: true,
          message: `Se importaron ${data.summary.validCount} contactos con éxito (${data.summary.invalidCount} inválidos omitidos).`
        });
        await fetchContacts();
        if (onRefreshNeeded) onRefreshNeeded();
      } else {
        setUploadFeedback({
          success: false,
          message: data.error || 'Error al procesar archivo.'
        });
      }
    } catch (err) {
      setUploadFeedback({
        success: false,
        message: 'Error de red al cargar el archivo.'
      });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSaveIndividualContact = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newContactForm.name,
          phone: newContactForm.phone,
          category: newContactForm.category,
          notes: newContactForm.notes,
          custom_fields: newContactForm.cargo ? { cargo: newContactForm.cargo } : {}
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNewContactForm({ name: '', phone: '', category: 'Reinas', notes: '', cargo: '' });
        await fetchContacts();
        if (onRefreshNeeded) onRefreshNeeded();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Error al guardar contacto.');
    }
  };

  const categories = [
    { id: 'Todos', label: 'Todos', icon: null },
    { id: 'Reinas', label: 'Reinas', icon: <Crown size={13} color="#f472b6" /> },
    { id: 'VIP', label: 'VIP', icon: <Star size={13} color="#fbbf24" /> },
    { id: 'Secretaría', label: 'Secretaría', icon: <Building2 size={13} color="#60a5fa" /> },
    { id: 'Líderes', label: 'Líderes', icon: <Users size={13} color="#34d399" /> },
    { id: 'General', label: 'General', icon: null }
  ];

  return (
    <div style={{
      flex: 1,
      height: '100%',
      overflowY: 'auto',
      backgroundColor: 'var(--wa-bg-panel)',
      padding: '24px 32px'
    }}>
      {/* Barra superior de herramientas */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 20
      }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Database size={22} color="#00a884" />
            <span>Directorio de Números Autorizados</span>
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--wa-text-secondary)', marginTop: 4 }}>
            Control de números registrados en la base de datos para filtrado y respuestas de la Secretaría.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <a
            href="/base_muestra.xlsx"
            download="INSCRIPCION_CANDIDATAS_REINADO_RIO_2026.xlsx"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: 'var(--wa-bg-hover)',
              color: 'var(--wa-text-primary)',
              textDecoration: 'none',
              fontSize: '0.82rem',
              fontWeight: 500,
              border: '1px solid var(--wa-border)'
            }}
          >
            <Download size={15} />
            <span>Descargar Muestra Reinado</span>
          </a>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 14px',
            borderRadius: '8px',
            backgroundColor: 'var(--wa-bg-hover)',
            color: 'var(--wa-text-primary)',
            fontSize: '0.82rem',
            fontWeight: 500,
            cursor: isUploading ? 'wait' : 'pointer',
            border: '1px solid var(--wa-border)'
          }}>
            <Upload size={15} color="#00a884" />
            <span>{isUploading ? 'Procesando Excel...' : 'Importar Excel / CSV'}</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              disabled={isUploading}
              style={{ display: 'none' }}
            />
          </label>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: '#00a884',
              color: '#111b21',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Registrar Número</span>
          </button>
        </div>
      </div>

      {uploadFeedback && (
        <div style={{
          marginBottom: 16,
          padding: '10px 14px',
          borderRadius: '8px',
          backgroundColor: uploadFeedback.success ? 'rgba(0, 168, 132, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: uploadFeedback.success ? '1px solid rgba(0, 168, 132, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
          color: uploadFeedback.success ? '#00a884' : '#f87171',
          fontSize: '0.84rem'
        }}>
          {uploadFeedback.message}
        </div>
      )}

      {/* Filtros de Categoría & Buscador */}
      <div style={{
        backgroundColor: 'var(--wa-bg-chat)',
        border: '1px solid var(--wa-border)',
        borderRadius: '10px',
        padding: '14px 18px',
        marginBottom: 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.id.toLowerCase();
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`wa-filter-pill ${isSelected ? (cat.id === 'Reinas' ? 'active-reinas' : 'active') : ''}`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        <div style={{ position: 'relative', width: 280 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--wa-text-muted)' }} />
          <input
            type="text"
            className="wa-search-input"
            placeholder="Buscar contacto o teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Acciones Masivas */}
      {selectedPhones.size > 0 && (
        <div style={{
          backgroundColor: 'rgba(244, 114, 182, 0.12)',
          border: '1px solid rgba(244, 114, 182, 0.3)',
          borderRadius: '8px',
          padding: '10px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f472b6', fontSize: '0.84rem', fontWeight: 600 }}>
            <CheckSquare size={16} />
            <span>{selectedPhones.size} contactos seleccionados</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--wa-text-secondary)' }}>Clasificar como:</span>
            <select
              value={bulkCategory}
              onChange={(e) => setBulkCategory(e.target.value)}
              style={{
                backgroundColor: 'var(--wa-bg-input)',
                border: '1px solid var(--wa-border)',
                borderRadius: '6px',
                padding: '5px 10px',
                color: 'var(--wa-text-primary)',
                fontSize: '0.82rem'
              }}
            >
              <option value="Reinas">Reinas</option>
              <option value="VIP">VIP</option>
              <option value="Secretaría">Secretaría</option>
              <option value="Líderes">Líderes</option>
              <option value="General">General</option>
            </select>

            <button
              type="button"
              onClick={handleApplyBulkCategory}
              style={{
                backgroundColor: '#ec4899',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Guardar Clasificación
            </button>
          </div>
        </div>
      )}

      {/* Tabla de Contactos */}
      <div style={{
        backgroundColor: 'var(--wa-bg-chat)',
        border: '1px solid var(--wa-border)',
        borderRadius: '10px',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--wa-bg-hover)', borderBottom: '1px solid var(--wa-border)' }}>
              <th style={{ padding: '12px 16px', width: 40 }}>
                <input
                  type="checkbox"
                  checked={contacts.length > 0 && selectedPhones.size === contacts.length}
                  onChange={handleToggleSelectAll}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th style={{ padding: '12px 16px', color: 'var(--wa-text-secondary)', fontWeight: 600 }}>Nombre</th>
              <th style={{ padding: '12px 16px', color: 'var(--wa-text-secondary)', fontWeight: 600 }}>Teléfono</th>
              <th style={{ padding: '12px 16px', color: 'var(--wa-text-secondary)', fontWeight: 600 }}>Categoría</th>
              <th style={{ padding: '12px 16px', color: 'var(--wa-text-secondary)', fontWeight: 600 }}>Notas</th>
              <th style={{ padding: '12px 16px', color: 'var(--wa-text-secondary)', fontWeight: 600 }}>Variables</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--wa-text-muted)' }}>
                  Cargando números autorizados...
                </td>
              </tr>
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--wa-text-muted)' }}>
                  No se encontraron contactos en esta categoría.
                </td>
              </tr>
            ) : (
              contacts.map((contact) => {
                const isChecked = selectedPhones.has(contact.phone);
                return (
                  <tr
                    key={contact.phone}
                    style={{
                      borderBottom: '1px solid rgba(134, 150, 160, 0.08)',
                      backgroundColor: isChecked ? 'rgba(0, 168, 132, 0.08)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleTogglePhone(contact.phone)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#ffffff' }}>
                      {contact.name}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#00a884', fontFamily: 'monospace', fontWeight: 600 }}>
                      {PhoneFormatter.formatDisplay(contact.phone)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <CategoryBadge
                        category={contact.category || 'General'}
                        onCategoryChange={async (newCat) => {
                          await fetch('/api/contacts/category', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ phones: [contact.phone], category: newCat })
                          });
                          await fetchContacts();
                          if (onRefreshNeeded) onRefreshNeeded();
                        }}
                        editable={true}
                      />
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--wa-text-secondary)', fontSize: '0.8rem' }}>
                      {contact.notes || '-'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {contact.custom_fields && Object.keys(contact.custom_fields).length > 0 ? (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {Object.entries(contact.custom_fields).slice(0, 2).map(([k, v]) => (
                            <span key={k} style={{
                              fontSize: '0.7rem',
                              backgroundColor: 'rgba(255,255,255,0.06)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              color: 'var(--wa-text-secondary)'
                            }}>
                              {k}: {String(v)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--wa-text-muted)', fontSize: '0.75rem' }}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para Agregar Contacto */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: 20
        }}>
          <div style={{
            width: '100%',
            maxWidth: 460,
            backgroundColor: 'var(--wa-bg-panel)',
            border: '1px solid var(--wa-border)',
            borderRadius: '12px',
            padding: 24
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: 16 }}>
              Registrar Número Autorizado
            </h3>
            <form onSubmit={handleSaveIndividualContact} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--wa-text-secondary)', marginBottom: 4 }}>
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Valentina Gómez"
                  value={newContactForm.name}
                  onChange={(e) => setNewContactForm({ ...newContactForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--wa-bg-input)',
                    border: '1px solid var(--wa-border)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: 'var(--wa-text-primary)',
                    fontSize: '0.86rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--wa-text-secondary)', marginBottom: 4 }}>
                  Teléfono WhatsApp
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 3001234567 o 573001234567"
                  value={newContactForm.phone}
                  onChange={(e) => setNewContactForm({ ...newContactForm, phone: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--wa-bg-input)',
                    border: '1px solid var(--wa-border)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: 'var(--wa-text-primary)',
                    fontSize: '0.86rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--wa-text-secondary)', marginBottom: 4 }}>
                  Categoría
                </label>
                <select
                  value={newContactForm.category}
                  onChange={(e) => setNewContactForm({ ...newContactForm, category: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--wa-bg-input)',
                    border: '1px solid var(--wa-border)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: 'var(--wa-text-primary)',
                    fontSize: '0.86rem'
                  }}
                >
                  <option value="Reinas">Reinas</option>
                  <option value="VIP">VIP</option>
                  <option value="Secretaría">Secretaría</option>
                  <option value="Líderes">Líderes</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--wa-text-secondary)', marginBottom: 4 }}>
                  Cargo o Rol
                </label>
                <input
                  type="text"
                  placeholder="Ej. Candidata Reinado 2026"
                  value={newContactForm.cargo}
                  onChange={(e) => setNewContactForm({ ...newContactForm, cargo: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--wa-bg-input)',
                    border: '1px solid var(--wa-border)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: 'var(--wa-text-primary)',
                    fontSize: '0.86rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--wa-text-secondary)', marginBottom: 4 }}>
                  Notas
                </label>
                <textarea
                  rows={2}
                  placeholder="Observaciones de seguimiento..."
                  value={newContactForm.notes}
                  onChange={(e) => setNewContactForm({ ...newContactForm, notes: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--wa-bg-input)',
                    border: '1px solid var(--wa-border)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: 'var(--wa-text-primary)',
                    fontSize: '0.86rem',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid var(--wa-border)',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    color: 'var(--wa-text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#00a884',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 18px',
                    color: '#111b21',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Guardar en Base de Datos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
