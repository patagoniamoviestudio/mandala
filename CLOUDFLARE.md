# Publicación en Cloudflare Pages

La aplicación es estática. Configuración para conectar este repositorio:

- Rama de producción: `main`.
- Framework: `None`.
- Comando de build: `exit 0`.
- Directorio de salida: `dist`.
- Directorio raíz: raíz del repositorio.

No requiere variables de entorno ni secretos. La reproducción de archivos propios se mantiene en la sesión del navegador.

La integración de GitHub permite desplegar nuevos commits automáticamente. Referencia oficial: https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
