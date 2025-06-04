# -------- build stage --------
    FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
    WORKDIR /src
    COPY OrtoProtesiApi.csproj ./
    RUN dotnet restore OrtoProtesiApi.csproj
    COPY . .
    RUN dotnet publish OrtoProtesiApi.csproj -c Release -o /app/publish
    
    # -------- runtime stage --------
    FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
    WORKDIR /app
    COPY --from=build /app/publish .
    # → copia lo script
    COPY wait-for-sql.sh /app/wait-for-sql.sh
    RUN chmod +x /app/wait-for-sql.sh
    # → fai partire lo script al posto di dotnet
    ENTRYPOINT ["./wait-for-sql.sh"]
    