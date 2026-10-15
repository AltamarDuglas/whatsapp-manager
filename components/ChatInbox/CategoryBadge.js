/**
 * ============================================================================
 * ARCHIVO: components/ChatInbox/CategoryBadge.js
 * DESCRIPCIÓN: Badge selector de categoría sin emojis.
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * REGLA ESTRICTA: Cero emojis. Uso exclusivo de vectores SVG de Lucide.
 * ============================================================================
 */

'use client';

import React, { useState } from 'react';
import { Crown, Star, Building2, Users, Tag, ChevronDown } from 'lucide-react';

export default function CategoryBadge({ category = 'General', onCategoryChange, editable = true }) {
  const [isOpen, setIsOpen] = useState(false);

  const getStyle = (cat) => {
    switch (cat.toLowerCase()) {
      case 'reinas':
        return {
          bg: 'rgba(236, 72, 153, 0.15)',
          color: '#f472b6',
          border: '1px solid rgba(236, 72, 153, 0.35)',
          icon: <Crown size={12} color="#f472b6" />
        };
      case 'vip':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          color: '#fbbf24',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          icon: <Star size={12} color="#fbbf24" />
        };
      case 'secretaría':
      case 'secretaria':
        return {
          bg: 'rgba(59, 130, 246, 0.15)',
          color: '#60a5fa',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          icon: <Building2 size={12} color="#60a5fa" />
        };
      case 'líderes':
      case 'lideres':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          color: '#34d399',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          icon: <Users size={12} color="#34d399" />
        };
      default:
        return {
          bg: 'rgba(134, 150, 160, 0.12)',
          color: '#8696a0',
          border: '1px solid rgba(134, 150, 160, 0.25)',
          icon: <Tag size={12} color="#8696a0" />
        };
    }
  };

  const currentStyle = getStyle(category);
  const categoriesList = ['Reinas', 'VIP', 'Secretaría', 'Líderes', 'General'];

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        disabled={!editable}
        onClick={() => editable && setIsOpen(!isOpen)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          background: currentStyle.bg,
          color: currentStyle.color,
          border: currentStyle.border,
          borderRadius: '9999px',
          padding: '2px 8px',
          fontSize: '0.7rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
          cursor: editable ? 'pointer' : 'default',
          transition: 'all 0.15s ease'
        }}
      >
        {currentStyle.icon}
        <span>{category}</span>
        {editable && <ChevronDown size={10} style={{ opacity: 0.6 }} />}
      </button>

      {/* Menú desplegable para cambiar de categoría */}
      {isOpen && (
        <>
          <div
            onClick={() => setIsOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 90 }}
          />
          <div style={{
            position: 'absolute',
            top: '115%',
            left: 0,
            background: 'var(--wa-bg-hover)',
            border: '1px solid var(--wa-border)',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            zIndex: 100,
            padding: '4px',
            minWidth: 140,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}>
            <div style={{ padding: '4px 8px', fontSize: '0.65rem', color: 'var(--wa-text-muted)', fontWeight: 600 }}>
              ASIGNAR CATEGORÍA
            </div>
            {categoriesList.map((cat) => {
              const itemStyle = getStyle(cat);
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setIsOpen(false);
                    if (onCategoryChange) onCategoryChange(cat);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: cat.toLowerCase() === category.toLowerCase() ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: itemStyle.color,
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease'
                  }}
                >
                  {itemStyle.icon}
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
