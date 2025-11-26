import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Client360 from './pages/Client360';
import Agenda from './pages/Agenda';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Clients": Clients,
    "Client360": Client360,
    "Agenda": Agenda,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};