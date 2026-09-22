"""Vertex AI Search over the sunglasses catalog, exposed to the agent as a tool.

The data store id arrives as an env var so the deployed archive stays
independent of the stack.
"""

import os

from google.adk.tools.vertex_ai_search_tool import VertexAiSearchTool

catalog_search = VertexAiSearchTool(
    data_store_id=os.environ["CATALOG_DATA_STORE"],
    max_results=5,
)
