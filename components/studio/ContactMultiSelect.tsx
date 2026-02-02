'use client';

/**
 * Contact Multi-Select Component
 * 
 * Searchable multi-select for choosing contacts to generate tracking tokens.
 * Used in the Studio publish flow.
 * 
 * Features:
 * - Debounced search via /api/contacts/search
 * - Multi-select with chips
 * - Shows email, name, company
 * - Indicates if contact already has a token
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  company_name: string;
  job_title: string | null;
  hasToken: boolean;
}

interface ContactMultiSelectProps {
  selectedContacts: Contact[];
  onSelectionChange: (contacts: Contact[]) => void;
  campaignId?: string;
  landingPageId?: string;
  disabled?: boolean;
}

export function ContactMultiSelect({
  selectedContacts,
  onSelectionChange,
  campaignId,
  landingPageId,
  disabled = false,
}: ContactMultiSelectProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ q: searchQuery });
        if (campaignId) params.append('campaign_id', campaignId);
        if (landingPageId) params.append('landing_page_id', landingPageId);

        const response = await fetch(`/api/contacts/search?${params}`);
        if (!response.ok) throw new Error('Search failed');

        const data = await response.json();
        setSearchResults(data.results || []);
      } catch (err) {
        setError('Failed to search contacts');
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, campaignId, landingPageId]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectContact = useCallback((contact: Contact) => {
    if (selectedContacts.some(c => c.id === contact.id)) {
      // Already selected - remove
      onSelectionChange(selectedContacts.filter(c => c.id !== contact.id));
    } else {
      // Add to selection
      onSelectionChange([...selectedContacts, contact]);
    }
    setSearchQuery('');
    inputRef.current?.focus();
  }, [selectedContacts, onSelectionChange]);

  const handleRemoveContact = useCallback((contactId: string) => {
    onSelectionChange(selectedContacts.filter(c => c.id !== contactId));
  }, [selectedContacts, onSelectionChange]);

  const isSelected = (contactId: string) => selectedContacts.some(c => c.id === contactId);

  return (
    <div ref={containerRef} className="relative">
      {/* Selected Contacts Chips */}
      {selectedContacts.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedContacts.map(contact => (
            <span
              key={contact.id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
            >
              <span className="truncate max-w-[150px]" title={contact.email}>
                {contact.full_name || contact.email}
              </span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveContact(contact.id)}
                  className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedContacts.length > 0 ? "Add more contacts..." : "Search contacts by name or email..."}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 disabled:bg-gray-100"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && searchQuery.length >= 2 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {error && (
            <div className="px-4 py-2 text-red-600 text-sm">{error}</div>
          )}

          {!error && searchResults.length === 0 && !isLoading && (
            <div className="px-4 py-2 text-gray-500 text-sm">
              No contacts found
            </div>
          )}

          {searchResults.map(contact => {
            const selected = isSelected(contact.id);
            return (
              <button
                key={contact.id}
                type="button"
                onClick={() => handleSelectContact(contact)}
                className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${
                  selected ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 truncate">
                      {contact.full_name}
                    </span>
                    {contact.hasToken && (
                      <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                        Has Token
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {contact.email}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {contact.company_name} {contact.job_title ? `• ${contact.job_title}` : ''}
                  </div>
                </div>
                {selected && (
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Count */}
      {selectedContacts.length > 0 && (
        <p className="mt-1 text-xs text-gray-500">
          {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''} selected
          {selectedContacts.filter(c => c.hasToken).length > 0 && (
            <span className="text-green-600 ml-1">
              ({selectedContacts.filter(c => c.hasToken).length} already have tokens)
            </span>
          )}
        </p>
      )}
    </div>
  );
}
