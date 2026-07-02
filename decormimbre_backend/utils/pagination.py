from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "por_pagina"
    max_page_size = 100
    page_query_param = "pagina"

    def get_paginated_response(self, data):
        return Response({
            "success": True,
            "data": data,
            "meta": {
                "total": self.page.paginator.count,
                "pagina": self.page.number,
                "por_pagina": self.get_page_size(self.request),
                "total_paginas": self.page.paginator.num_pages,
            },
            "message": "OK",
        })
