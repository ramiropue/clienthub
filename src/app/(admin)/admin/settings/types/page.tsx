"use client";

import React, { useEffect, useState } from 'react';
import { getWorkTypes, saveWorkType, deleteWorkType, WorkType } from '@/lib/data';
import { eur } from '@/lib/mock-data';
import { Icon } from '@/components/ui/icon';
import { ButtonCustom } from '@/components/ui/button-custom';
import { WorkTypeModal } from '@/components/admin/work-type-modal';

export default function AdminTypesPage() {
  const [types, setTypes] = useState<WorkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<WorkType | null>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await getWorkTypes(false); // Only active ones
    setTypes(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (data: WorkType, isNew: boolean) => {
    await saveWorkType(data, isNew);
    setModalOpen(false);
    setEditingType(null);
    loadData();
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`¿Seguro que quieres eliminar el tipo de trabajo "${name}"? Los trabajos antiguos se mantendrán.`)) {
      await deleteWorkType(id);
      loadData();
    }
  };

  // Group work types by their 'group' property
  const groupedTypes = types.reduce((acc, t) => {
    if (!acc[t.group]) acc[t.group] = [];
    acc[t.group].push(t);
    return acc;
  }, {} as Record<string, WorkType[]>);

  // Friendly names for groups
  const groupLabels: Record<string, string> = {
    'contenido': 'Creación de contenido',
    'estrategia': 'Estrategia y gestión',
    'extras': 'Herramientas y extras'
  };

  return (
    <div>
      <div className="main-header">
        <div>
          <div className="eyebrow">Configuración</div>
          <h1 className="h2" style={{ margin: '6px 0 0' }}>Tipos de trabajo</h1>
        </div>
        <div className="row gap-2">
          <ButtonCustom variant="primary" icon="plus" onClick={() => {
            setEditingType(null);
            setModalOpen(true);
          }}>
            Añadir tipo
          </ButtonCustom>
        </div>
      </div>
      
      <div className="main-content">
        <div className="col gap-6">
          {Object.entries(groupedTypes).map(([groupKey, types]) => (
            <div key={groupKey} className="card card-pad">
              <h3 className="h3 mb-4">{groupLabels[groupKey] || groupKey}</h3>
              
              <div className="type-grid">
                {types.map(t => (
                  <div key={t.id} className="type-card" style={{ cursor: 'default', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="row between" style={{ alignItems: 'flex-start' }}>
                      <div className="row gap-2" style={{ alignItems: 'center' }}>
                        <div style={{ 
                          width: 32, 
                          height: 32, 
                          borderRadius: 8, 
                          background: 'var(--bg)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          border: '1px solid var(--line)'
                        }}>
                          <Icon name={t.icon} size={16} />
                        </div>
                        <span className="t-name" style={{ fontSize: 14, fontWeight: 500 }}>{t.name}</span>
                      </div>
                      <div className="row gap-2">
                        <button className="btn-icon" onClick={() => {
                          setEditingType(t);
                          setModalOpen(true);
                        }}>
                          <Icon name="edit" size={16} />
                        </button>
                        <button className="btn-icon" style={{ color: 'var(--error)' }} onClick={() => handleDelete(t.id, t.name)}>
                          <Icon name="trash" size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2" style={{ padding: '8px 12px', background: 'var(--bg)', borderRadius: 6, display: 'inline-flex', alignSelf: 'flex-start' }}>
                      <span className="t-price" style={{ margin: 0, fontWeight: 600 }}>{eur(t.price)} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>/ {t.unit}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <WorkTypeModal 
        open={modalOpen} 
        onClose={() => {
          setModalOpen(false);
          setEditingType(null);
        }}
        initialData={editingType}
        onSave={handleSave}
      />
    </div>
  );
}
