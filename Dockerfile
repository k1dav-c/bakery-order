# 使用輕量級的 Nginx Alpine 鏡像作為基底
FROM nginx:alpine

# 將專案目錄下的所有檔案複製到 Nginx 的預設網頁存放目錄
# 由於此應用程式透過 index.html 中的 importmap 直接載入依賴，不需要編譯步驟
COPY . /usr/share/nginx/html

# 暴露 80 端口供外部存取
EXPOSE 80

# 啟動 Nginx 並保持在前景執行
CMD ["nginx", "-g", "daemon off;"]
