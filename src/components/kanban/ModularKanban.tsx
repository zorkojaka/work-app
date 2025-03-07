import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, DropResult, Draggable } from '@hello-pangea/dnd';
import { PencilIcon, PlusIcon, TrashIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/solid';
import { KanbanColumn, KanbanConfig } from '../../types/kanban';

// 1. Definicija tipov
interface ModularKanbanProps<T> {
  items: T[];
  config: KanbanConfig;
  onItemUpdate: (item: T) => void;
  onItemClick?: (item: T) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemId: (item: T) => string;
  getItemColumn: (item: T) => string;
  getItemSubcategory?: (item: T) => string | undefined;
  updateItemPosition: (item: T, columnId: string, subcategoryId?: string) => T;
  onConfigUpdate?: (config: KanbanConfig) => Promise<void> | void;
  additionalData?: any;
  onAddItem?: () => void;
  addItemLabel?: string;
}

// 2. Komponenta za urejanje faz v stolpcu
interface ColumnPhaseEditorProps<T> {
  column: KanbanColumn;
  columnIndex: number;
  items: T[];
  getItemId: (item: T) => string;
  getItemColumn: (item: T) => string;
  getItemSubcategory: (item: T) => string | undefined;
  onUpdateColumn: (columnIndex: number, updatedColumn: KanbanColumn) => Promise<void>;
  onItemUpdate: (item: T) => Promise<void>;
  updateItemPosition: (item: T, columnId: string, subcategoryId?: string) => T;
}

function ColumnPhaseEditor<T>({
  column,
  columnIndex,
  items,
  getItemId,
  getItemColumn,
  getItemSubcategory,
  onUpdateColumn,
  onItemUpdate,
  updateItemPosition
}: ColumnPhaseEditorProps<T>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingPhases, setEditingPhases] = useState(column.subcategories || []);

  const handleSave = async () => {
    const updatedColumn = {
      ...column,
      subcategories: editingPhases
    };
    await onUpdateColumn(columnIndex, updatedColumn);
    setIsEditing(false);
  };

  const handleDeletePhase = async (phaseIndex: number) => {
    const phaseToDelete = editingPhases[phaseIndex];
    
    // Preveri če je to zadnja faza
    if (editingPhases.length <= 1) {
      alert('Stolpec mora imeti vsaj eno fazo!');
      return;
    }

    // Najdi elemente v tej fazi
    const itemsInPhase = items.filter(item => 
      getItemColumn(item) === column.id && 
      getItemSubcategory(item) === phaseToDelete.id
    );

    // Določi novo fazo za elemente
    let newPhaseId: string | null = null;
    if (itemsInPhase.length > 0) {
      if (phaseIndex > 0) {
        // Prestavi na prejšnjo fazo
        newPhaseId = editingPhases[phaseIndex - 1].id;
      } else if (phaseIndex < editingPhases.length - 1) {
        // Prestavi na naslednjo fazo
        newPhaseId = editingPhases[phaseIndex + 1].id;
      }
    }

    // Posodobi faze
    const newPhases = [...editingPhases];
    newPhases.splice(phaseIndex, 1);
    setEditingPhases(newPhases);

    // Posodobi elemente v Firebase
    if (itemsInPhase.length > 0 && newPhaseId) {
      try {
        await Promise.all(itemsInPhase.map(async (item) => {
          const updatedItem = updateItemPosition(item, column.id, newPhaseId || undefined);
          await onItemUpdate(updatedItem);
        }));
      } catch (error) {
        console.error('Napaka pri prestavljanju elementov:', error);
      }
    }
  };

  const handleAddPhase = () => {
    setEditingPhases([
      ...editingPhases,
      {
        id: `PHASE_${Date.now()}`,
        title: 'Nova faza',
        status: column.status
      }
    ]);
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="w-full mt-4 p-2 text-gray-500 hover:text-gray-700 flex items-center justify-center gap-2 rounded-md hover:bg-gray-50"
      >
        <PencilIcon className="w-4 h-4" />
        <span className="text-sm">Uredi faze</span>
      </button>
    );
  }

  return (
    <div className="mt-4 p-4 border-t border-gray-200">
      <div className="space-y-2">
        {editingPhases.map((phase, index) => (
          <div key={phase.id} className="flex items-center gap-2">
            <input
              type="text"
              value={phase.title}
              onChange={(e) => {
                const newPhases = [...editingPhases];
                newPhases[index] = { ...phase, title: e.target.value };
                setEditingPhases(newPhases);
              }}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md"
            />
            <button
              onClick={() => handleDeletePhase(index)}
              className="p-1 text-red-500 hover:text-red-700"
              title="Izbriši fazo"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={handleAddPhase}
          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <PlusIcon className="w-4 h-4" />
          Dodaj fazo
        </button>
        <button
          onClick={handleSave}
          className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Shrani
        </button>
        <button
          onClick={() => setIsEditing(false)}
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700"
        >
          Prekliči
        </button>
      </div>
    </div>
  );
}

// 3. Glavna komponenta za Kanban tablo
function ModularKanban<T>({
  items,
  config,
  onItemUpdate,
  onItemClick,
  renderItem,
  getItemId,
  getItemColumn,
  getItemSubcategory,
  updateItemPosition,
  onConfigUpdate,
  additionalData,
  onAddItem,
  addItemLabel
}: ModularKanbanProps<T>) {
  // 3.1 Stanje komponente
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<T[]>(items);
  const kanbanConfig = config || { columns: [], defaultColumn: '' };

  // 3.2 Filtriranje elementov
  React.useEffect(() => {
    if (!searchQuery) {
      setFilteredItems(items);
      return;
    }

    // Implementiraj iskanje po elementih - to je odvisno od tipa T
    // Za zdaj predpostavljamo, da je to funkcija ki jo poda uporabnik
    if (additionalData?.filterItems) {
      setFilteredItems(additionalData.filterItems(items, searchQuery));
    } else {
      setFilteredItems(items);
    }
  }, [items, searchQuery, additionalData]);

  // 3.3 Preverjanje, ali so filtri aktivni
  const areFiltersActive = useCallback(() => {
    if (!additionalData?.areFiltersActive) return false;
    return additionalData.areFiltersActive();
  }, [additionalData]);

  // 3.4 Funkcija za zapiranje filtrov in resetiranje
  const handleToggleFilters = () => {
    if (showFilters && additionalData?.resetFilters) {
      additionalData.resetFilters();
    }
    setShowFilters(!showFilters);
  };

  // 3.5 Pomožne funkcije
  const getColumnItems = (columnId: string) => {
    return filteredItems.filter(item => getItemColumn(item) === columnId);
  };

  const getStageItems = (columnId: string, stageId: string) => {
    return filteredItems.filter(item => 
      getItemColumn(item) === columnId && 
      getItemSubcategory(item) === stageId
    );
  };

  // 3.6 Upravljanje z drag-and-drop
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { draggableId, destination, source } = result;
    console.log('Drop destination:', destination);
    
    // Format: COLUMN_ID|SUBCATEGORY_ID
    const destParts = destination.droppableId.split('|');
    const destColumnId = destParts[0];
    const destSubcategoryId = destParts.length > 1 ? destParts[1] : undefined;
    
    // Pridobi izvorni stolpec
    const sourceParts = source.droppableId.split('|');
    const sourceColumnId = sourceParts[0];
    
    console.log('Parsed destination:', { destColumnId, destSubcategoryId });
    console.log('Source column:', sourceColumnId);

    // Najdi element ki ga premikamo
    const item = items.find(item => getItemId(item) === draggableId);
    if (!item) {
      console.error('Element ni najden:', draggableId);
      return;
    }

    // Posodobi element
    const updatedItem = updateItemPosition(item, destColumnId, destSubcategoryId);
    console.log('Posodobljen element:', updatedItem);
    
    try {
      // Če se je stolpec spremenil in imamo funkcijo za posodobitev zgodovine statusa
      if (sourceColumnId !== destColumnId && additionalData?.updateStatusHistory) {
        // Zagotovimo, da je subcategoryId pravilno nastavljen pred klicem updateStatusHistory
        console.log('Kličem updateStatusHistory z elementom:', updatedItem);
        await additionalData.updateStatusHistory(updatedItem, sourceColumnId, destColumnId);
      } else {
        // Posodobi v Firebase
        await onItemUpdate(updatedItem);
        console.log('Element posodobljen:', getItemId(updatedItem));
      }
    } catch (error) {
      console.error('Napaka pri premikanju elementa:', error);
    }
  };

  // 3.7 Posodobitev konfiguracije
  const handleUpdateColumn = async (columnIndex: number, updatedColumn: KanbanColumn) => {
    if (!onConfigUpdate) return;

    try {
      const newColumns = [...kanbanConfig.columns];
      newColumns[columnIndex] = updatedColumn;
      
      const updatedConfig = {
        ...kanbanConfig,
        columns: newColumns
      };
      
      await onConfigUpdate(updatedConfig);
    } catch (error) {
      console.error('Napaka pri posodabljanju stolpca:', error);
    }
  };

  // 3.8 Izris komponente
  return (
    <div className="flex flex-col">
      {/* 3.8.1 Iskalna vrstica */}
      <div className="mb-6 flex gap-2 items-center">
        {onAddItem && (
          <button
            onClick={onAddItem}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            {addItemLabel || "Dodaj"}
          </button>
        )}

        {/* Gumba za odpiranje/zapiranje vseh projektov */}
        {additionalData?.expandAllItems && (
          <button
            onClick={additionalData.expandAllItems}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center gap-1"
            title="Odpri vse projekte"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            Odpri vse
          </button>
        )}
        
        {additionalData?.collapseAllItems && (
          <button
            onClick={additionalData.collapseAllItems}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center gap-1"
            title="Zapri vse projekte"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            Zapri vse
          </button>
        )}

        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Išči..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <button
          onClick={handleToggleFilters}
          className={`px-4 py-2 text-sm font-medium ${areFiltersActive() ? 'text-white bg-blue-600 hover:bg-blue-700' : 'text-gray-700 bg-white hover:bg-gray-50'} border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-2`}
          title="Napredni filtri"
        >
          <FunnelIcon className="w-5 h-5" />
          Filtri
        </button>
      </div>

      {/* 3.8.2 Napredni filtri */}
      {showFilters && additionalData?.renderFilters && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          {additionalData.renderFilters()}
        </div>
      )}

      {/* 3.8.3 Kanban tabla */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto p-4 min-h-[calc(100vh-200px)]">
          {kanbanConfig.columns.map((column, columnIndex) => {
            // Določimo barvo glede na status
            const columnColor = column.color || 'bg-gray-500';

            return (
              <div
                key={column.id}
                className="flex-shrink-0 w-80 bg-gray-100 rounded-lg"
              >
                {/* Glava stolpca */}
                <div className={`p-3 ${columnColor} text-white rounded-t-lg flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    {additionalData?.getColumnIcon && additionalData.getColumnIcon(column)}
                    <h3 className="font-semibold">{column.title}</h3>
                  </div>
                  <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full">
                    {getColumnItems(column.id).length}
                  </span>
                </div>

                {/* Vsebina stolpca */}
                <div className="p-2">
                  {column.subcategories?.map((stage) => (
                    <div key={stage.id} className="mb-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex justify-between items-center">
                        <span>{stage.title}</span>
                        <span className="text-xs text-gray-500">
                          {getStageItems(column.id, stage.id).length}
                        </span>
                      </h4>
                      <Droppable droppableId={`${column.id}|${stage.id}`}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`min-h-[100px] rounded-md p-2 ${
                              snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-gray-50'
                            }`}
                          >
                            {getStageItems(column.id, stage.id).map((item, index) => (
                              <Draggable
                                key={getItemId(item)}
                                draggableId={getItemId(item)}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={{
                                      ...provided.draggableProps.style,
                                      opacity: snapshot.isDragging ? 0.5 : 1
                                    }}
                                  >
                                    {renderItem(item, index)}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  ))}
                  
                  {/* Urejevalnik faz */}
                  {onConfigUpdate && (
                    <ColumnPhaseEditor
                      column={column}
                      columnIndex={columnIndex}
                      items={items}
                      getItemId={getItemId}
                      getItemColumn={getItemColumn}
                      getItemSubcategory={getItemSubcategory}
                      onUpdateColumn={handleUpdateColumn}
                      onItemUpdate={onItemUpdate}
                      updateItemPosition={updateItemPosition}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}

export default ModularKanban;
