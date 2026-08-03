import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Folder, Trash2, Tag, Check, Layers } from 'lucide-react';
import { Collection } from '../types';
import { api } from '../services/api';

interface TeamCollectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCollectionId?: string;
  onSelectCollection: (collectionId?: string) => void;
}

export const TeamCollectionsModal: React.FC<TeamCollectionsModalProps> = ({
  isOpen,
  onClose,
  selectedCollectionId,
  onSelectCollection
}) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [loading, setLoading] = useState(false);

  const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];

  const loadCollections = async () => {
    try {
      const data = await api.getCollections();
      setCollections(data);
    } catch (err) {
      console.error('Failed to load collections:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCollections();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || loading) return;

    setLoading(true);
    try {
      await api.createCollection(name.trim(), description.trim(), color);
      setName('');
      setDescription('');
      await loadCollections();
    } catch (err: any) {
      alert(err.message || 'Failed to create collection');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete collection "${name}"?`)) return;
    try {
      await api.deleteCollection(id);
      if (selectedCollectionId === id) {
        onSelectCollection(undefined);
      }
      await loadCollections();
    } catch (err: any) {
      alert('Failed to delete collection');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="p-4 bg-emerald-600 text-white border-b-4 border-black flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-300 border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <FolderPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-xl tracking-tight uppercase">Team Collections & Workspaces</h2>
              <p className="text-xs text-emerald-100 font-medium">Organize team articles into shared project hubs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white text-black border-2 border-black hover:bg-yellow-300 font-bold transition-transform active:translate-y-0.5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Create Collection Form */}
          <form onSubmit={handleCreate} className="p-4 bg-emerald-50 border-2 border-black space-y-3">
            <h3 className="font-extrabold text-sm uppercase text-black flex items-center gap-1.5">
              <FolderPlus className="w-4 h-4 text-emerald-700" /> Create New Shared Collection
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Collection Name (e.g. Q3 Market Intel)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="px-3 py-2 border-2 border-black font-semibold text-sm focus:outline-none bg-white"
              />
              <input
                type="text"
                placeholder="Description (Optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="px-3 py-2 border-2 border-black font-semibold text-sm focus:outline-none bg-white"
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-700">Theme Color:</span>
                {colors.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 border-2 border-black transition-transform ${
                      color === c ? 'scale-125 ring-2 ring-black ring-offset-1' : 'opacity-80 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="px-5 py-2 bg-yellow-400 text-black font-black border-2 border-black hover:bg-yellow-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 text-xs uppercase"
              >
                + Add Collection
              </button>
            </div>
          </form>

          {/* All Collections List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-sm uppercase text-black flex items-center gap-2">
                <Folder className="w-4 h-4 text-emerald-600" /> Active Shared Folders ({collections.length})
              </h3>
              {selectedCollectionId && (
                <button
                  onClick={() => onSelectCollection(undefined)}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Clear Filter
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {collections.map(col => {
                const isSelected = selectedCollectionId === col.id;
                return (
                  <div
                    key={col.id}
                    className={`p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative transition-transform ${
                      isSelected ? 'bg-yellow-200' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className="cursor-pointer flex-1"
                        onClick={() => {
                          onSelectCollection(isSelected ? undefined : col.id);
                          onClose();
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 border border-black inline-block"
                            style={{ backgroundColor: col.color }}
                          />
                          <h4 className="font-extrabold text-base text-black">{col.name}</h4>
                        </div>
                        {col.description && (
                          <p className="text-xs text-gray-600 mt-1 font-medium">{col.description}</p>
                        )}
                        <div className="mt-3 flex items-center gap-2 text-xs font-bold text-gray-700">
                          <span className="px-2 py-0.5 bg-gray-100 border border-black">
                            {col.articleCount || 0} Articles
                          </span>
                          {isSelected && (
                            <span className="px-2 py-0.5 bg-black text-white flex items-center gap-1">
                              <Check className="w-3 h-3" /> Active Filter
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(col.id, col.name)}
                        className="p-1.5 hover:bg-red-100 border border-black text-red-600 transition-colors"
                        title="Delete Collection"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-100 border-t-4 border-black flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white text-black font-bold border-2 border-black hover:bg-yellow-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 text-sm uppercase"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
