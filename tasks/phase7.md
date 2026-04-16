# Plan Phase 7 — Console VNC, Sauvegarde & Fonctionnalités Avancées

Ce plan décrit l'intégration de la console VNC, la gestion des nœuds, Proxmox Backup Server (PBS) et des fonctionnalités mobiles avancées dans MyProx.

## Nouvelles Limites de Plan (Free vs Premium)
*   **Plan Free** : 1 Serveur PVE (Proxmox Virtual Environment) + **1 Serveur PBS (Proxmox Backup Server)**. Diagnostiques et Notifications Push inclus.
*   **Plan Premium** : Serveurs PVE et PBS illimités. Synchronisation iCloud incluse.
    Penser à update le site vitrine et les plans sur l'application
---

## 1. Console VNC (NoVNC)
*   **WebView iOS/Android** chargeant l'interface NoVNC native de PVE.
*   Authentification automatisée via l'injection d'un ticket VNC temporaire (API `/nodes/{node}/{type}/{vmid}/vncproxy`).
*   Bouton "Console" ajouté sur l'écran `VMDetailsScreen`.

## 2. Paramètres & État du Serveur (Node)
*   Nouvel écran ⚙️ **ServerSettingsScreen** par serveur.
*   Affichage des ressources hôtes (CPU serveur, RAM serveur, versions).
*   **Mises à jour (APT)** : Liste des paquets à mettre à jour et bouton de rafraîchissement. *Option d'application des updates selon le retour utilisateur.*

---

## 3. Intégration Proxmox Backup Server (PBS) - 🚀 Nouveauté
*   **Fusion UI PVE/PBS** : Un serveur PBS peut être ajouté à l'application au même titre qu'un PVE, depuis le bouton "Ajouter".
*   **Datastores & Tâches** : Affichage des Datastores PBS (usage, espace libre) et des logs globaux des tâches de sauvegarde (GC, Prune, Backup).
*   **Dashboard unifié** : Distinction visuelle claire (badge ou couleur dédiée) entre un serveur 🖥️ PVE et un serveur 💾 PBS sur la page d'accueil.

---

## 4. Diagnostiques Systèmes (Gratuit)
*   Ajout d'un outil d'analyse sur `ServerSettingsScreen`.
*   Avertissement si un dataset/stockage dépasse 90% d'utilisation.
*   Vérification des nœuds hors-ligne ou du crash récurrent de certaines VMs (lecture des logs `/cluster/log`).
*   Statut "Santé des disques" (ZFS / SMART) si exposé par l'API.

---

## 5. Synchronisation iCloud (Exclusif Premium)
*   **Sauvegarde des serveurs** : Via la librairie `expo-secure-store` et un module iCloud (KVS - Key-Value Storage, ou base locale synchronisée).
*   Lors de l'installation sur un nouvel iPhone/iPad avec le même Apple ID, les serveurs (PVE et PBS) sont automatiquement restaurés sans avoir à retaper les IPs et mots de passe locaux.
*   *Limité au compte Apple de l'utilisateur (zéro accès par notre backend, sécurité optimale).*

---

## 6. Notifications Push (Gratuit)
*   Intégration d'**Expo Notifications**.
*   **Alertes Locales (Background Fetch)** ou via Cloud Relay si configuré :
    *   Le serveur PVE ou PBS ne répond plus.
    *   Nouvelle mise à jour Proxmox majeure disponible.
    *   Notification d'erreur de sauvegarde (remontée depuis PBS ou logs PVE).

---

## 💡 User Review Required

> [!WARNING]
> **Expérience VNC Cloud** : Le websocket VNC est compliqué à proxyfier si l'utilisateur est hors du réseau. Confirmez-vous que la Console ne sera dispo qu'en **mode Local** (wifi) pour la v1 ?

> [!IMPORTANT]
> **Push Notifications sur l'App Store / Play Store** : Pour envoyer des alertes quand l'app est fermée, le backend MyProx a besoin des tokens Push des appareils. Cela nécessite de configurer les clés APNs (Apple) Firebase (Android). Ok pour intégrer Expo Push ?

> [!NOTE]
> **Mises à jour** : Voulez-vous pouvoir lancer `apt dist-upgrade` depuis l'application, ou l'écran sert-il juste pour la consultation ?
Il doit permettre de pouvoir faire les maj mais prévient l'utilisateur que c'est à ses risques de le faire , il doit cependant afficher la liste des maj avant ça pour que l'utilisateur puisse voir ce qu'il va se passer.
