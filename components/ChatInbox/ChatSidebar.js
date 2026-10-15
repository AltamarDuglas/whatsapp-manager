/**
 * ============================================================================
 * ARCHIVO: components/ChatInbox/ChatSidebar.js
 * DESCRIPCIÓN: Panel de chats idéntico a WhatsApp Desktop (Modo Oscuro).
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * REGLA ESTRICTA: Sin emojis. Solo vectores SVG limpios.
 * ============================================================================
 */

'use client';

import React from 'react';
import {
  Search,
  MoreVertical,
  Plus,
  Crown,
  Star,
  Building2,
  Users,
  CheckCheck,
  Pin,
  FileSpreadsheet,
  ChevronDown,
  ShieldCheck
} from 'lucide-react';
import { PhoneFormatter } from '@/src/services/PhoneFormatter';
import CategoryBadge from './CategoryBadge';

export default function ChatSidebar({
  chats = [],
  selectedPhone,
  onSelectChat,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  isLoading
}) {
  const categoryFilters = [
    { id: 'Todos', label: 'Todos', icon: null },
    { id: 'Reinas', label: 'Reinas', icon: <Crown size={13} color="#f472b6" />, isReinas: true },
    { id: 'VIP', label: 'VIP', icon: <Star size={13} color="#fbbf24" /> },
    { id: 'Secretaría', label: 'Secretaría', icon: <Building2 size={13} color="#60a5fa" /> },
    { id: 'Líderes', label: 'Líderes', icon: <Users size={13} color="#34d399" /> }
  ];

  const reinasCount = chats.filter((c) => c.category?.toLowerCase() === 'reinas').length;
  const unreadTotal = chats.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  // Paleta de colores para avatares circulares de WhatsApp
  const avatarColors = ['#1e3a5f', '#1b4332', '#4c1d95', '#7c2d12', '#374151', '#065f46'];

  return (
    <aside
      aria-label="Lista de Chats"
      style={{
        width: 380,
        minWidth: 320,
        height: '100%',
        backgroundColor: 'var(--wa-bg-sidebar)',
        borderRight: '1px solid var(--wa-border)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Cabecera idéntica a WhatsApp: "Chats" + ⋮ + Botón verde circular (+) */}
      <div style={{ padding: '12px 16px 8px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
            Chats
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              title="Opciones"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--wa-text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 4
              }}
            >
              <MoreVertical size={20} />
            </button>
            <button
              type="button"
              className="wa-btn-round-green"
              title="Registrar nuevo número autorizado"
              style={{ width: 34, height: 34 }}
            >
              <Plus size={20} color="#111b21" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Buscador de WhatsApp con icono de lupa */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: 10,
              color: 'var(--wa-text-muted)'
            }}
          />
          <input
            type="text"
            className="wa-search-input"
            placeholder="Buscar un chat o iniciar uno nuevo"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Fila de Pills de Filtro (Todos, Reinas, VIP, Secretaría, etc.) */}
        <div style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 4,
          scrollbarWidth: 'none'
        }}>
          {categoryFilters.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.id.toLowerCase();
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`wa-filter-pill ${isSelected ? (cat.isReinas ? 'active-reinas' : 'active') : ''}`}
              >
                {cat.icon}
                <span>{cat.label}</span>
                {cat.isReinas && reinasCount > 0 && (
                  <span style={{
                    fontSize: '0.66rem',
                    background: isSelected ? 'rgba(0,0,0,0.3)' : '#ec4899',
                    color: '#ffffff',
                    padding: '1px 5px',
                    borderRadius: '9999px',
                    fontWeight: 700
                  }}>
                    {reinasCount}
                  </span>
                )}
              </button>
            );
          })}
          <button
            type="button"
            className="wa-filter-pill"
            style={{ padding: '6px 8px' }}
            title="Más filtros"
          >
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Franja de estado del filtro de Base de Datos */}
      <div style={{
        padding: '6px 16px',
        backgroundColor: 'rgba(0, 168, 132, 0.08)',
        borderBottom: '1px solid var(--wa-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.72rem',
        color: '#00a884'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShieldCheck size={13} />
          <span>Filtro activo: Solo números en base de datos</span>
        </div>
        <span style={{ color: 'var(--wa-text-muted)' }}>{chats.length} autorizados</span>
      </div>

      {/* Lista de Chats con Scroll */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--wa-text-muted)', fontSize: '0.84rem' }}>
            Cargando conversaciones autorizadas...
          </div>
        ) : chats.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--wa-text-muted)' }}>
            <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--wa-text-secondary)' }}>
              No hay chats en esta categoría
            </p>
            <p style={{ fontSize: '0.78rem', marginTop: 6, lineHeight: 1.4 }}>
              Solo se muestran números registrados en la base de datos que pertenecen a &quot;{selectedCategory}&quot;.
            </p>
          </div>
        ) : (
          chats.map((chat, idx) => {
            const isSelected = selectedPhone === chat.phone;
            const hasUnread = (chat.unreadCount || 0) > 0;
            const isReinas = chat.category?.toLowerCase() === 'reinas';
            const initial = chat.name ? chat.name.charAt(0).toUpperCase() : '#';
            const avatarBg = isReinas ? '#9d174d' : avatarColors[idx % avatarColors.length];

            return (
              <div
                key={chat.phone}
                onClick={() => onSelectChat(chat.phone)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '10px 16px',
                  borderBottom: '1px solid rgba(134, 150, 160, 0.08)',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'var(--wa-bg-active)' : 'transparent',
                  transition: 'background-color 0.1s ease'
                }}
              >
                {/* Avatar Circular estilo WhatsApp */}
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: avatarBg,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1rem',
                  flexShrink: 0
                }}>
                  {isReinas ? <Crown size={20} color="#f472b6" /> : initial}
                </div>

                {/* Contenido del Item */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Fila superior: Nombre + Hora */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <h3 style={{
                      fontSize: '0.94rem',
                      fontWeight: hasUnread ? 700 : 500,
                      color: hasUnread ? '#ffffff' : 'var(--wa-text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {chat.name}
                    </h3>
                    <span style={{
                      fontSize: '0.72rem',
                      color: hasUnread ? '#00a884' : 'var(--wa-text-muted)',
                      fontWeight: hasUnread ? 600 : 400,
                      flexShrink: 0
                    }}>
                      {chat.lastMessageAt
                        ? new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </span>
                  </div>

                  {/* Fila inferior: Estado de lectura + Mensaje + Badge contador */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '0.82rem',
                      color: hasUnread ? 'var(--wa-text-primary)' : 'var(--wa-text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: 240
                    }}>
                      {chat.lastMessageDirection === 'outbound' && (
                        <CheckCheck size={15} color="#53bdeb" style={{ flexShrink: 0 }} />
                      )}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {chat.lastMessage || 'Sin mensajes'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {/* Badge de categoría sutil */}
                      <CategoryBadge category={chat.category || 'General'} editable={false} />

                      {/* Contador de no leídos verde de WhatsApp */}
                      {hasUnread && (
                        <span className="wa-badge-unread">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
