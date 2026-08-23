'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { getCategoryIcon } from '@/lib/icon-map';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import type { CategoryOption } from '@/components/budget/ExpenseFormModal';
import { CATEGORY_TYPE_OPTIONS } from '@/lib/category-options';

interface CategoryManagerProps {
  categories: (CategoryOption & { isDefault: boolean })[];
  onChanged: () => void;
}

export default function CategoryManager({ categories, onChanged }: CategoryManagerProps) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('other');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), type: newType, icon: 'circle' }),
    });
    const result = await res.json();
    if (!res.ok) {
      toast.error(result.error || 'Could not create category.');
      return;
    }
    toast.success('Category added.');
    setNewName('');
    setAdding(false);
    onChanged();
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim() }),
    });
    const result = await res.json();
    if (!res.ok) {
      toast.error(result.error || 'Could not rename category.');
      return;
    }
    setEditingId(null);
    onChanged();
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (!res.ok) {
      toast.error(result.error || 'Could not delete category.');
      return;
    }
    toast.success('Category deleted.');
    onChanged();
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Categories</h3>
        {!adding && (
          <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        )}
      </div>

      {adding && (
        <div className="mb-3 flex items-center gap-2">
          <Input
            placeholder="Category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="h-9"
          />
          <Select value={newType} onChange={(e) => setNewType(e.target.value)} className="h-9 w-36">
            {CATEGORY_TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
          <button
            onClick={handleAdd}
            className="rounded-md p-2 text-success hover:bg-success/10"
            aria-label="Save category"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={() => setAdding(false)}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted"
            aria-label="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <ul className="space-y-1">
        {categories.map((cat) => {
          const Icon = getCategoryIcon(cat.icon);
          const isEditing = editingId === cat._id;
          return (
            <li
              key={cat._id}
              className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-muted/50"
            >
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              {isEditing ? (
                <>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8 flex-1"
                    autoFocus
                  />
                  <button
                    onClick={() => handleRename(cat._id)}
                    className="rounded-md p-1.5 text-success hover:bg-success/10"
                    aria-label="Save"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                    aria-label="Cancel"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-foreground">{cat.name}</span>
                  <button
                    onClick={() => {
                      setEditingId(cat._id);
                      setEditName(cat.name);
                    }}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Rename category"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat._id)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-danger/10 hover:text-danger"
                    aria-label="Delete category"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
