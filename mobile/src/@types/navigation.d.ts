export declare global {
  namespace ReactNavigation {
    interface RootParamList {
      new: undefined; // undefined significa que não tem nenhum parâmetro, basta chamar o nome
      pools: undefined;
      find: undefined;
      details: {
        id: string;
      }
    }
  }
}