Coloca aquí tus certificados SSL:
- fullchain.pem
- privkey.pem

Puedes obtenerlos con Certbot:
  sudo certbot certonly --standalone -d tu-dominio.com

O usar los que te da Hostinger en el panel.

Luego descomenta las líneas SSL en nginx/nginx.conf
