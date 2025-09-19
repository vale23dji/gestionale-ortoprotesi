# STAGE 1: build
FROM mcr.microsoft.com/dotnet/sdk:8.0.204 AS build
WORKDIR /src
COPY OrtoProtesiApi/OrtoProtesiApi.csproj OrtoProtesiApi/
RUN dotnet restore OrtoProtesiApi/OrtoProtesiApi.csproj
COPY . .
RUN dotnet publish OrtoProtesiApi/OrtoProtesiApi.csproj -c Release -o /app/publish

# STAGE 2: runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "OrtoProtesiApi.dll"]
