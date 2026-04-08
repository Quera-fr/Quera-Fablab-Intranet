docker buildx build --platform linux/arm64 -t quera/intranet .

#MSYS_NO_PATHCONV=1 docker run -it -p 6565:6565 -v "$(pwd):/app" -e DB_HOST='82.96.139.77' -e DB_PORT='3306' -e DB_NAME='intranet' -e DB_USER='quera-app' -e DB_PASSWORD='Quera2026!' quera/intranet