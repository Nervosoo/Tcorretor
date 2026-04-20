FROM eclipse-temurin:17-jre

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl unzip \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /opt

RUN curl -L "https://languagetool.org/download/LanguageTool-stable.zip" -o LanguageTool-stable.zip \
  && unzip LanguageTool-stable.zip \
  && rm LanguageTool-stable.zip \
  && mv LanguageTool-* languagetool

WORKDIR /opt/languagetool

COPY docker/languagetool/server.properties ./server.properties

EXPOSE 8010

CMD ["java", "-cp", "languagetool-server.jar", "org.languagetool.server.HTTPServer", "--config", "server.properties", "--port", "8010", "--allow-origin", "*", "--public"]
