export const environment = {
  ROOT_API_URL: 'http://localhost:8000/api', 
  KEYCLOAK_LOGIN_API_URL: 'http://localhost:9090/realms/user/protocol/openid-connect/auth?client_id=shopping-client&redirect_uri=http://localhost:8084/api/v1/auth/remote/callback&response_type=code&scope=openid'
  
};
