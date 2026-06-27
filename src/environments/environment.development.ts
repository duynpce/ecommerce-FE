export const environment = {
  ROOT_API_URL: 'http://localhost:8084/api', // api for gateway
  LOCAL_LOGIN_API_URL: 'http://localhost:9090/realms/user/protocol/openid-connect/auth?client_id=shopping-client&redirect_uri=http://localhost:4200/callback/local&response_type=code&scope=openid', 
  REMOTE_LOGIN_API_URL: 'http://localhost:8080/realms/user/protocol/openid-connect/auth?client_id=shopping-client&redirect_uri=http://localhost:4200/callback/local&response_type=code&scope=openid'
  
};
