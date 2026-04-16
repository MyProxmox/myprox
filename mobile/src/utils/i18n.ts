import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

const translations = {
  fr: {
    // Navigation
    nav_servers: 'Serveurs',
    nav_settings: 'Paramètres',

    // Auth
    auth_login: 'Se connecter',
    auth_register: "S'inscrire",
    auth_email: 'Email',
    auth_password: 'Mot de passe',
    auth_error_fields: 'Veuillez remplir tous les champs',
    auth_switch_register: "Pas encore de compte ? S'inscrire",
    auth_switch_login: 'Déjà un compte ? Se connecter',
    auth_tagline: 'Gérez votre Proxmox partout',

    // Dashboard
    dashboard_title: 'Mes serveurs',
    dashboard_empty_title: 'Aucun serveur',
    dashboard_empty_sub: 'Ajoutez votre premier serveur Proxmox',
    dashboard_add: 'Ajouter un serveur',
    dashboard_verified: 'vérifié',
    dashboard_verified_plural: 'vérifiés',
    dashboard_server: 'serveur',
    dashboard_servers: 'serveurs',
    dashboard_mode_cloud: 'Cloud',
    dashboard_mode_local: 'Local',

    // Onboarding
    onboarding_title: 'Ajouter un serveur',
    onboarding_name: 'Nom du serveur',
    onboarding_ip: 'IP Proxmox (ex: 192.168.1.100)',
    onboarding_port: 'Port (défaut: 8006)',
    onboarding_user: 'Utilisateur (ex: root@pam)',
    onboarding_password: 'Mot de passe Proxmox',
    onboarding_mode_local: 'Mode Local',
    onboarding_mode_cloud: 'Mode Cloud',
    onboarding_add: 'Ajouter',
    onboarding_adding: 'Ajout...',

    // VM List
    vms_empty: 'Aucun VM trouvé',
    containers_empty: 'Aucun container trouvé',
    vms_tab: 'VMs',
    containers_tab: 'Containers',
    vm_action_start: 'Start',
    vm_action_stop: 'Stop',
    vm_action_restart: 'Restart',
    vm_action_success: 'Action lancée',
    vm_action_error: 'Action échouée',
    vm_load_error: 'Impossible de charger les VMs',

    // VM Details
    vm_details_title: 'Détails',
    vm_details_status: 'Statut',
    vm_details_node: 'Node',
    vm_details_cpu: 'CPU',
    vm_details_ram: 'RAM',
    vm_details_uptime: 'Uptime',
    vm_details_type: 'Type',
    vm_details_delete: 'Supprimer',
    vm_details_delete_confirm: 'Êtes-vous sûr de vouloir supprimer cette VM ? Cette action est irréversible.',
    vm_details_delete_success: 'VM supprimée',

    // Settings
    settings_title: 'Paramètres',
    settings_account: 'Compte',
    settings_plan: 'Plan',
    settings_plan_free: 'Gratuit',
    settings_plan_premium: 'Premium',
    settings_limits: 'Limites',
    settings_servers_used: 'Serveurs utilisés',
    settings_cloud_servers: 'Serveurs cloud',
    settings_logout: 'Se déconnecter',
    settings_upgrade: 'Passer à Premium',
    settings_manage: 'Gérer mon abonnement',

    // Errors
    error_title: 'Erreur',
    error_generic: 'Une erreur est survenue',
    success_title: 'Succès',
  },

  en: {
    nav_servers: 'Servers',
    nav_settings: 'Settings',

    auth_login: 'Sign in',
    auth_register: 'Sign up',
    auth_email: 'Email',
    auth_password: 'Password',
    auth_error_fields: 'Please fill in all fields',
    auth_switch_register: "Don't have an account? Sign up",
    auth_switch_login: 'Already have an account? Sign in',
    auth_tagline: 'Manage your Proxmox anywhere',

    dashboard_title: 'My servers',
    dashboard_empty_title: 'No servers',
    dashboard_empty_sub: 'Add your first Proxmox server',
    dashboard_add: 'Add a server',
    dashboard_verified: 'verified',
    dashboard_verified_plural: 'verified',
    dashboard_server: 'server',
    dashboard_servers: 'servers',
    dashboard_mode_cloud: 'Cloud',
    dashboard_mode_local: 'Local',

    onboarding_title: 'Add a server',
    onboarding_name: 'Server name',
    onboarding_ip: 'Proxmox IP (e.g. 192.168.1.100)',
    onboarding_port: 'Port (default: 8006)',
    onboarding_user: 'User (e.g. root@pam)',
    onboarding_password: 'Proxmox password',
    onboarding_mode_local: 'Local mode',
    onboarding_mode_cloud: 'Cloud mode',
    onboarding_add: 'Add',
    onboarding_adding: 'Adding...',

    vms_empty: 'No VMs found',
    containers_empty: 'No containers found',
    vms_tab: 'VMs',
    containers_tab: 'Containers',
    vm_action_start: 'Start',
    vm_action_stop: 'Stop',
    vm_action_restart: 'Restart',
    vm_action_success: 'Action started',
    vm_action_error: 'Action failed',
    vm_load_error: 'Could not load VMs',

    vm_details_title: 'Details',
    vm_details_status: 'Status',
    vm_details_node: 'Node',
    vm_details_cpu: 'CPU',
    vm_details_ram: 'RAM',
    vm_details_uptime: 'Uptime',
    vm_details_type: 'Type',
    vm_details_delete: 'Delete',
    vm_details_delete_confirm: 'Are you sure you want to delete this VM? This action is irreversible.',
    vm_details_delete_success: 'VM deleted',

    settings_title: 'Settings',
    settings_account: 'Account',
    settings_plan: 'Plan',
    settings_plan_free: 'Free',
    settings_plan_premium: 'Premium',
    settings_limits: 'Limits',
    settings_servers_used: 'Servers used',
    settings_cloud_servers: 'Cloud servers',
    settings_logout: 'Sign out',
    settings_upgrade: 'Upgrade to Premium',
    settings_manage: 'Manage subscription',

    error_title: 'Error',
    error_generic: 'Something went wrong',
    success_title: 'Success',
  },

  es: {
    nav_servers: 'Servidores',
    nav_settings: 'Ajustes',

    auth_login: 'Iniciar sesión',
    auth_register: 'Registrarse',
    auth_email: 'Correo electrónico',
    auth_password: 'Contraseña',
    auth_error_fields: 'Por favor completa todos los campos',
    auth_switch_register: '¿No tienes cuenta? Regístrate',
    auth_switch_login: '¿Ya tienes cuenta? Inicia sesión',
    auth_tagline: 'Gestiona tu Proxmox desde cualquier lugar',

    dashboard_title: 'Mis servidores',
    dashboard_empty_title: 'Sin servidores',
    dashboard_empty_sub: 'Agrega tu primer servidor Proxmox',
    dashboard_add: 'Agregar servidor',
    dashboard_verified: 'verificado',
    dashboard_verified_plural: 'verificados',
    dashboard_server: 'servidor',
    dashboard_servers: 'servidores',
    dashboard_mode_cloud: 'Nube',
    dashboard_mode_local: 'Local',

    onboarding_title: 'Agregar servidor',
    onboarding_name: 'Nombre del servidor',
    onboarding_ip: 'IP de Proxmox (ej: 192.168.1.100)',
    onboarding_port: 'Puerto (defecto: 8006)',
    onboarding_user: 'Usuario (ej: root@pam)',
    onboarding_password: 'Contraseña de Proxmox',
    onboarding_mode_local: 'Modo local',
    onboarding_mode_cloud: 'Modo nube',
    onboarding_add: 'Agregar',
    onboarding_adding: 'Agregando...',

    vms_empty: 'No se encontraron VMs',
    containers_empty: 'No se encontraron contenedores',
    vms_tab: 'VMs',
    containers_tab: 'Contenedores',
    vm_action_start: 'Iniciar',
    vm_action_stop: 'Detener',
    vm_action_restart: 'Reiniciar',
    vm_action_success: 'Acción iniciada',
    vm_action_error: 'Acción fallida',
    vm_load_error: 'No se pudieron cargar las VMs',

    vm_details_title: 'Detalles',
    vm_details_status: 'Estado',
    vm_details_node: 'Nodo',
    vm_details_cpu: 'CPU',
    vm_details_ram: 'RAM',
    vm_details_uptime: 'Tiempo activo',
    vm_details_type: 'Tipo',
    vm_details_delete: 'Eliminar',
    vm_details_delete_confirm: '¿Seguro que quieres eliminar esta VM? Esta acción es irreversible.',
    vm_details_delete_success: 'VM eliminada',

    settings_title: 'Ajustes',
    settings_account: 'Cuenta',
    settings_plan: 'Plan',
    settings_plan_free: 'Gratis',
    settings_plan_premium: 'Premium',
    settings_limits: 'Límites',
    settings_servers_used: 'Servidores usados',
    settings_cloud_servers: 'Servidores en la nube',
    settings_logout: 'Cerrar sesión',
    settings_upgrade: 'Cambiar a Premium',
    settings_manage: 'Gestionar suscripción',

    error_title: 'Error',
    error_generic: 'Algo salió mal',
    success_title: 'Éxito',
  },
};

const i18n = new I18n(translations);

// Use device language — fallback to English
const deviceLocale = getLocales()[0]?.languageCode ?? 'en';
i18n.locale = ['fr', 'en', 'es'].includes(deviceLocale) ? deviceLocale : 'en';
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export const t = (key: string, options?: Record<string, unknown>): string =>
  i18n.t(key, options);

export default i18n;
