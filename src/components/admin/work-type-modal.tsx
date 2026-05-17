import React, { useState, useEffect } from 'react';
import { WorkType } from '@/lib/data';
import { Icon } from '@/components/ui/icon';

interface WorkTypeModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: WorkType | null;
  onSave: (data: WorkType, isNew: boolean) => Promise<void>;
}

export function WorkTypeModal({ open, onClose, initialData, onSave }: WorkTypeModalProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [unit, setUnit] = useState('ud');
  const [group, setGroup] = useState('contenido');
  const [icon, setIcon] = useState('video');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setName(initialData.name);
        setPrice(initialData.price);
        setUnit(initialData.unit);
        setGroup(initialData.group);
        setIcon(initialData.icon);
      } else {
        setName('');
        setPrice(0);
        setUnit('ud');
        setGroup('contenido');
        setIcon('video');
      }
    }
  }, [open, initialData]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const isNew = !initialData;
    // Generate an ID if it's new
    const id = isNew ? name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') : initialData!.id;

    await onSave({
      id,
      name,
      price: Number(price),
      unit,
      group,
      icon
    }, isNew);
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal fade-in" onClick={e => e.stopPropagation()}>
        <div className="row between mb-4" style={{ padding: '22px 24px 0' }}>
          <h3 className="h3 m-0" style={{ fontFamily: 'var(--font-display)', fontSize: 28 }}>{initialData ? 'Editar tipo' : 'Añadir nuevo tipo'}</h3>
          <button className="btn-icon" onClick={onClose} disabled={loading}><Icon name="x" size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="col gap-4" style={{ padding: '20px 24px' }}>
            <div className="field">
              <label>Nombre del servicio</label>
              <input 
                type="text" 
                className="input" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                placeholder="Ej. Reel corporativo"
              />
            </div>

            <div className="row gap-4">
              <div className="field" style={{ flex: 1 }}>
                <label>Precio</label>
                <input 
                  type="number" 
                  className="input" 
                  value={price} 
                  onChange={e => setPrice(Number(e.target.value))} 
                  required 
                  min="0"
                />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Unidad</label>
                <select className="select" value={unit} onChange={e => setUnit(e.target.value)}>
                  <option value="ud">Unidad (ud)</option>
                  <option value="hora">Hora (hora)</option>
                  <option value="mes">Mes (mes)</option>
                  <option value="sem">Semana (sem)</option>
                </select>
              </div>
            </div>

            <div className="row gap-4">
              <div className="field" style={{ flex: 1 }}>
                <label>Categoría (Grupo)</label>
                <select className="select" value={group} onChange={e => setGroup(e.target.value)}>
                  <option value="contenido">Creación de contenido</option>
                  <option value="estrategia">Estrategia y gestión</option>
                  <option value="extras">Herramientas y extras</option>
                </select>
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Icono</label>
                <select className="select" value={icon} onChange={e => setIcon(e.target.value)}>
                  <option value="video">Vídeo</option>
                  <option value="image">Imagen</option>
                  <option value="layers">Carrusel / Capas</option>
                  <option value="compass">Estrategia / Brújula</option>
                  <option value="mic">Micrófono / Reunión</option>
                  <option value="chat">Chat / Comunidad</option>
                  <option value="wrench">Herramientas</option>
                  <option value="star">Estrella</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
