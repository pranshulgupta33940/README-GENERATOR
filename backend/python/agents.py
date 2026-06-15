from langgraph.graph import StateGraph
import google.generativeai as genai
from langchain.schema import HumanMessage
from tools import get_file_tree, read_file, set_repo_path
import os
from prompts import select_files_prompt, summarize_prompt, generate_readme_prompt
import sys
from dotenv import load_dotenv
load_dotenv()
from typing import TypedDict, List
import re
import json

class GraphState(TypedDict):
    selected_files: List[str]
    summaries: List[str]
    readme: str

# Load Gemini API key (Make sure to set it in your .env or environment)
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


# Initialize the Gemini model (chat-compatible)
llm = genai.GenerativeModel("gemini-2.0-flash")


# Step 1: LLM selects important files
def agent_select_files(state):
    file_tree = get_file_tree()
    prompt = select_files_prompt.format(file_tree="\n".join(file_tree))
    response = llm.generate_content(prompt)
    raw = response.text.strip()

    # Try extracting JSON array from the response
    try:
        # Find JSON-like list using regex
        match = re.search(r'\[(.*?)\]', raw, re.DOTALL)
        if match:
            json_like = f"[{match.group(1)}]"
            selected_files = json.loads(json_like)
        else:
            # Fallback: split by newlines
            selected_files = [line.strip().strip('"').strip(',') for line in raw.splitlines() if line.strip()]
    except Exception as e:
        print("⚠️ Error parsing selected files, fallback to line-splitting", e)
        selected_files = [line.strip().strip('"').strip(',') for line in raw.splitlines() if line.strip()]

    print("✅ Cleaned selected files:", selected_files)
    return {"selected_files": selected_files}


# Step 2: Summarize selected files one-by-one
def agent_summarize_files(state):
    summaries = []
    for filename in state["selected_files"]:
        content = read_file(filename)
        print(f"Reading file: {filename}")
        print("Content preview:", content[:200])

        if not content.strip():
            summaries.append(f"### {filename}\n(No content found)")
            continue

        prompt = summarize_prompt.format(filename=filename, content=content[:3000])
        summary = llm.generate_content(prompt).text
        summaries.append(f"### {filename}\n{summary}")
    return {"summaries": summaries}


# Step 3: Generate final README from all summaries
def agent_generate_readme(state):
    joined = "\n\n".join(state["summaries"])
    prompt = generate_readme_prompt.format(
        summaries=joined,
        instruction="Based on the following file summaries, generate a clean and concise README.md that explains the project as a whole. Do not describe each file individually. Instead, explain the purpose of the project, its core features, setup instructions, and any important dependencies or configurations."
    )
    
    response = llm.generate_content(prompt)
    
    try:
        # If response is chunked
        readme = "".join([part.text for part in response.parts])
    except AttributeError:
        # Fallback if response is not chunked
        readme = response.text

    return {"readme": readme}


# Define graph structure
def run_agent(repo_path):

    set_repo_path(repo_path)

    builder = StateGraph(GraphState)
    builder.add_node("select_files", agent_select_files)
    builder.add_node("summarize", agent_summarize_files)
    builder.add_node("generate_readme", agent_generate_readme)

    builder.set_entry_point("select_files")
    builder.add_edge("select_files", "summarize")
    builder.add_edge("summarize", "generate_readme")
    builder.set_finish_point("generate_readme")

    graph = builder.compile()
    output = graph.invoke({})
    readme = output["readme"]
    write_readme_to_file(readme, root_dir=repo_path)
    return readme

def write_readme_to_file(content, root_dir="temp"):
    path = os.path.join(root_dir, "README.md")
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"✅ README.md written to {path}")

# This is for local testing. Will be wrapped in a FastAPI route later.
if __name__ == "__main__":
    repo_path = sys.argv[1]
    result = run_agent(repo_path)
    print(result)