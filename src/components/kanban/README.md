# Modularna Kanban komponenta

Ta direktorij vsebuje modularno Kanban komponento, ki jo lahko uporabite za prikaz različnih tipov elementov v Kanban tabli.

## Komponente

### ModularKanban

Glavna komponenta, ki omogoča prikaz kateregakoli tipa elementov v Kanban tabli.

#### Lastnosti

- `items`: Seznam elementov za prikaz
- `config`: Konfiguracija Kanban table
- `onItemUpdate`: Funkcija za posodobitev elementa
- `onItemClick`: Funkcija za klik na element
- `renderItem`: Funkcija za izris elementa
- `getItemId`: Funkcija za pridobitev ID-ja elementa
- `getItemColumn`: Funkcija za pridobitev stolpca elementa
- `getItemSubcategory`: Funkcija za pridobitev podkategorije elementa
- `updateItemPosition`: Funkcija za posodobitev položaja elementa
- `onConfigUpdate`: Funkcija za posodobitev konfiguracije
- `additionalData`: Dodatni podatki za komponento

### ProjectKanban

Implementacija ModularKanban komponente za prikaz projektov.

#### Lastnosti

- `projects`: Seznam projektov
- `clients`: Seznam strank
- `kanbanConfig`: Konfiguracija Kanban table
- `onProjectUpdate`: Funkcija za posodobitev projekta
- `onProjectClick`: Funkcija za klik na projekt
- `onConfigUpdate`: Funkcija za posodobitev konfiguracije
- `uiConfig`: UI konfiguracija

## Uporaba

```tsx
import ProjectKanban from '../kanban/ProjectKanban';

// ...

<ProjectKanban
  projects={projects}
  clients={clients}
  kanbanConfig={kanbanConfig}
  onProjectUpdate={handleProjectUpdate}
  onProjectClick={handleProjectClick}
  onConfigUpdate={handleUpdateKanbanConfig}
  uiConfig={uiConfig}
/>
```

## Prilagoditev za druge tipe

Za uporabo ModularKanban komponente z drugimi tipi elementov, ustvarite novo komponento, ki implementira potrebne funkcije:

```tsx
import ModularKanban from './ModularKanban';

const TaskKanban = ({ tasks, ...props }) => {
  return (
    <ModularKanban
      items={tasks}
      config={taskKanbanConfig}
      onItemUpdate={handleTaskUpdate}
      onItemClick={handleTaskClick}
      renderItem={(task, index) => (
        <TaskCard
          key={task.id}
          task={task}
          onClick={() => handleTaskClick(task)}
        />
      )}
      getItemId={(task) => task.id}
      getItemColumn={(task) => task.status}
      getItemSubcategory={(task) => task.phaseId}
      updateItemPosition={(task, columnId, subcategoryId) => ({
        ...task,
        status: columnId,
        phaseId: subcategoryId
      })}
      onConfigUpdate={handleUpdateTaskKanbanConfig}
    />
  );
};
```
