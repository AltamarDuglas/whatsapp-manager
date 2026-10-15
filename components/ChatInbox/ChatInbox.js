/**
 * ============================================================================
 * ARCHIVO: components/ChatInbox/ChatInbox.js
 * DESCRIPCIÓN: Contenedor maestro de la bandeja de entrada de chats filtrados.
 * PRINCIPIO SOLID: Single Responsibility Principle (SRP)
 * ESTÉTICA: WhatsApp Desktop Dark Mode sin emojis (100% vectores).
 * ============================================================================
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';

export default function ChatInbox({ onStatsUpdate }) {
  const [chats, setChats] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [isSending, setIsSending] = useState(false);

  // 1. Cargar lista de chats filtrados desde la API
  const fetchChats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'Todos') {
        params.append('category', selectedCategory);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const res = await fetch(`/api/chats?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setChats(data.data || []);
        if (onStatsUpdate) {
          const reinas = (data.data || []).filter(
            (c) => c.category?.toLowerCase() === 'reinas'
          ).length;
          onStatsUpdate({ total: data.data.length, reinas });
        }

        // Si no hay seleccionado un chat y hay resultados, seleccionamos el primero automáticamente
        if (!selectedPhone && data.data && data.data.length > 0) {
          setSelectedPhone(data.data[0].phone);
          fetchChatHistory(data.data[0].phone);
        }
      }
    } catch (err) {
      console.error('[ChatInbox] Error al obtener chats:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery, onStatsUpdate, selectedPhone]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // 2. Cargar historial del chat seleccionado
  const fetchChatHistory = async (phone) => {
    try {
      const res = await fetch(`/api/chats/${phone}`);
      const data = await res.json();
      if (data.success) {
        setActiveChat(data.data);
      }
    } catch (err) {
      console.error('[ChatInbox] Error al cargar historial:', err);
    }
  };

  const handleSelectChat = (phone) => {
    setSelectedPhone(phone);
    fetchChatHistory(phone);
  };

  // 3. Enviar respuesta desde el operador
  const handleSendMessage = async ({ phone, content, repliedBy }) => {
    setIsSending(true);
    try {
      const res = await fetch(`/api/chats/${phone}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, repliedBy })
      });
      const data = await res.json();
      if (data.success) {
        await fetchChatHistory(phone);
        await fetchChats();
      } else {
        alert(`Error al enviar: ${data.error}`);
      }
    } catch (err) {
      console.error('[ChatInbox] Error enviando respuesta:', err);
    } finally {
      setIsSending(false);
    }
  };

  // 4. Cambiar y guardar la categoría del contacto (ej. a "Reinas")
  const handleUpdateCategory = async (phone, newCategory) => {
    try {
      const res = await fetch(`/api/chats/${phone}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newCategory })
      });
      const data = await res.json();
      if (data.success) {
        if (activeChat && activeChat.contact) {
          setActiveChat({
            ...activeChat,
            contact: {
              ...activeChat.contact,
              category: newCategory
            }
          });
        }
        await fetchChats();
      }
    } catch (err) {
      console.error('[ChatInbox] Error al actualizar categoría:', err);
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      width: '100%',
      backgroundColor: 'var(--wa-bg-deep)',
      overflow: 'hidden'
    }}>
      <ChatSidebar
        chats={chats}
        selectedPhone={selectedPhone}
        onSelectChat={handleSelectChat}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isLoading={isLoading}
      />
      <ChatWindow
        activeChat={activeChat}
        onSendMessage={handleSendMessage}
        onUpdateCategory={handleUpdateCategory}
        isSending={isSending}
      />
    </div>
  );
}
