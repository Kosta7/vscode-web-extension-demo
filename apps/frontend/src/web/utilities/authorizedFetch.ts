export const authorizedFetch = async (
  input: RequestInfo,
  init?: RequestInit,
  onUnauthorized?: Function
): Promise<Response> => {
  try {
    const response = await fetch(input, init);
    if (response.status === 401) onUnauthorized?.();

    return response;
  } catch (e) {
    throw e;
  }
};
