import { KanbanConfig } from '../types/kanban';
import { Project } from '../types/project';

export const defaultKanbanConfig: KanbanConfig = {
  columns: [
    {
      status: 'DRAFT',
      title: 'V PRIPRAVI',
      subcategories: [
        {
          id: 'projektno-povprasevanje',
          title: 'Projektno povpraševanje',
          status: 'DRAFT'
        },
        {
          id: 'kontakt-stranke',
          title: 'Kontakt stranke',
          status: 'DRAFT'
        },
        {
          id: 'ogled-na-objektu',
          title: 'Ogled na objektu',
          status: 'DRAFT'
        },
        {
          id: 'priprava-ponudbe',
          title: 'Priprava ponudbe',
          status: 'DRAFT'
        },
        {
          id: 'poslana-ponudba',
          title: 'Poslana ponudba - Follow up',
          status: 'DRAFT'
        },
        {
          id: 'potrjen-projekt',
          title: 'Potrjen projekt - Izvedba',
          status: 'DRAFT'
        }
      ]
    },
    {
      status: 'IN_PROGRESS',
      title: 'V IZVAJANJU',
      subcategories: [
        {
          id: 'priprava-materiala',
          title: 'Priprava materiala',
          status: 'IN_PROGRESS'
        },
        {
          id: 'narocen-material',
          title: 'Naročen material',
          status: 'IN_PROGRESS'
        },
        {
          id: 'v-delu',
          title: 'V delu',
          status: 'IN_PROGRESS'
        },
        {
          id: 'opravljena-izvedba',
          title: 'Opravljena izvedba',
          status: 'IN_PROGRESS'
        }
      ]
    },
    {
      status: 'COMPLETED',
      title: 'ZAKLJUČENO',
      subcategories: [
        {
          id: 'poslan-racun',
          title: 'Poslan račun',
          status: 'COMPLETED'
        },
        {
          id: 'zakljucen-projekt',
          title: 'Zaključen projekt',
          status: 'COMPLETED'
        }
      ]
    },
    {
      status: 'CANCELLED',
      title: 'PREKLICANO',
      subcategories: [
        {
          id: 'preklicano-stranka',
          title: 'Preklicano - stranka',
          status: 'CANCELLED'
        },
        {
          id: 'preklicano-izvajalec',
          title: 'Preklicano - izvajalec',
          status: 'CANCELLED'
        }
      ]
    }
  ],
  defaultColumn: 'draft'
};
