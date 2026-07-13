interface MetaDto{
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number; 
}

export interface ResponseDto<T>{
  isSuccess: boolean
  message?: string
  data: T
  metaData?: MetaDto
}